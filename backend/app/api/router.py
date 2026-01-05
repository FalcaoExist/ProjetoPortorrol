import os
from datetime import datetime, timedelta
from typing import List, Optional
import io

# Fast API Imports
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Depends, Header, Response, status, Query
from jose import jwt
from dotenv import load_dotenv

# --- IMPORTS DE SERVIÇOS E REPOSITÓRIOS ---
from app.core.supabase_client import supabase
from app.core.dependencies import get_auth_service, get_current_user, get_user_service
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.service_models import UserCreateRequest, UserUpdateRequest
from app.repositories.import_repository import process_import_file

# --- IMPORTS DO DASHBOARD (AQUI ESTAVA O ERRO) ---
# Importamos do arquivo específico que criamos em app/schemas/dashboard_schemas.py
from app.services.dashboard_service import DashboardService
from app.api.schemas import (
    SkuAnaliseResponse, 
    ConfigUpdate, 
    StatusProduto, 
    FilialResponse
)

# --- IMPORTS DE AUTH/USERS (DO SEU ARQUIVO LOCAL .schemas) ---
from .schemas import (
    LoginRequest,
    LoginResponse,
    UserCreateResponse,
    UserGetResponse,
    UserListResponse,
    UserUpdateResponse,
)

load_dotenv()

router = APIRouter()

# Configurações JWT
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=LoginResponse)
def login(response: Response, data: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    try:
        user_dict = auth_service.check_credentials(data.email, data.password)
    except Exception:
        user_dict = None

    if not user_dict:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"success": False, "user": None, "message": "E-mail ou senha incorretos."}

    if user_dict.get("is_active") is False:
        response.status_code = status.HTTP_403_FORBIDDEN
        return {"success": False, "user": None, "message": "Conta desativada."}
    
    token_data = {"sub": str(user_dict.get("user_id")), "role": user_dict.get("role")}
    access_token = create_access_token(token_data)
    
    response.set_cookie(
        key="access_token", value=f"Bearer {access_token}", httponly=True, 
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax", secure=False, path="/"
    )

    return {"success": True, "user": user_dict, "message": "Login realizado com sucesso"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"success": True, "message": "Logout realizado"}

@router.post("/users", response_model=UserCreateResponse, status_code=201)
def create_user(data: UserCreateRequest, user_service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    created_user = user_service.create_new_user(data)
    return { "success": True, "user": created_user, "message": "Criado com sucesso!" }

@router.get("/users", response_model=UserListResponse)
def list_users(name: Optional[str] = None, email: Optional[str] = None, user_service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    return user_service.get_formatted_users(name, email)

@router.get("/users/all", response_model=UserListResponse)
def get_all_users(user_service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    return user_service.get_formatted_users()

@router.get("/users/{user_id}", response_model=UserGetResponse)
def get_user_by_id(user_id: str, user_service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    user = user_service.get_user_by_id(user_id)
    return { "success": True, "user": user }

@router.put("/users/{user_id}", response_model=UserUpdateResponse)
def update_user(user_id: str, data: UserUpdateRequest, user_service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    updated_user = user_service.update_existing_user(user_id, data)
    return { "success": True, "user": updated_user, "message": "Atualizado com sucesso!" }

@router.delete("/users/{user_id}", status_code=204)
def delete_user_endpoint(user_id: str, service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    service.delete_user_permanently(user_id)
    return None

@router.get("/suppliers", response_model=List[str])
def get_suppliers_list(user_service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    return user_service.get_available_suppliers()

@router.get("/me", response_model=UserGetResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return { "success": True, "user": current_user }

# Helper rápido para tentar pegar o ID do usuário sem travar a request se falhar
async def get_user_id_safe(authorization: str = Header(None)):
    if not authorization: return None
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id if user and user.user else None
    except: return None

@router.post("/stock/import")
async def import_stock(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Envie um arquivo CSV")

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler upload: {e}")

    user_id = await get_user_id_safe(authorization)
    background_tasks.add_task(process_import_file, contents, user_id)

    return {
        "success": True,
        "message": "Upload recebido! O processamento continuará em segundo plano.",
        "status": "processing_started"
    }


def get_dashboard_service():
    return DashboardService()

@router.get("/dashboard/skus", response_model=List[SkuAnaliseResponse])
def listar_skus_dashboard(
    status: Optional[StatusProduto] = Query(None, description="Filtre por: RUPTURA, EXCESSO ou OK"),
    filial: Optional[str] = Query(None, description="Filtrar visão por filial (JV, SP, POA)"),
    service: DashboardService = Depends(get_dashboard_service),
    # current_user: dict = Depends(get_current_user) # Descomente se quiser proteger a rota
):
    """
    Retorna a lista de SKUs com seus status calculados.
    Permite filtrar por Ruptura (<50%) ou Excesso (>100%).
    """
    return service.get_skus_filtrados(filtro_status=status.value if status else None, filial=filial)

@router.get("/dashboard/filiais", response_model=List[FilialResponse])
def listar_filiais_dashboard(service: DashboardService = Depends(get_dashboard_service)):
    """Retorna as filiais disponíveis para preencher o select/dropdown do front."""
    return service.get_filiais()

@router.post("/dashboard/config/lead-time")
def atualizar_lead_time(config: ConfigUpdate, service: DashboardService = Depends(get_dashboard_service)):
    """Define o Lead Time global para cálculos."""
    return service.update_lead_time(config.valor)

@router.post("/dashboard/config/orcamento")
def atualizar_orcamento(config: ConfigUpdate, service: DashboardService = Depends(get_dashboard_service)):
    """Define o Budget disponível."""
    return service.update_orcamento(config.valor)

@router.get("/dashboard/search", response_model=List[SkuAnaliseResponse])
def buscar_skus(
    q: str = Query(..., description="nome, código ou ID do SKU"),
    service: DashboardService = Depends(get_dashboard_service)
):
    """
    faz uma busca de SKUs por Nome (parcial), Código (exato) ou ID.
    Retorna uma lista de resultados.
    """
    return service.buscar_produtos(q)