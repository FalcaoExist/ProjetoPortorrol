import os
from datetime import datetime, timedelta
from typing import List, Optional
import io

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Depends, Header, Response, status, Query, Request
from jose import jwt # Mantido caso precise de validação manual
from dotenv import load_dotenv


from app.core.supabase_client import supabase
from app.core.dependencies import (
    get_audit_service,
    get_auth_service,
    get_current_user,
    get_user_repository,
    get_user_service,
)
from app.core.interfaces import IUserRepository
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.service_models import UserCreateRequest, UserUpdateRequest

# --- IMPORTS DO DASHBOARD (Novos da Feature) ---
from app.repositories.import_repository import process_import_file
from app.services.dashboard_service import DashboardService
from app.api.schemas import (
    SkuAnaliseResponse, 
    ConfigUpdate, 
    StatusProduto, 
    FilialResponse
)

# --- IMPORTS DE SCHEMAS (Locais) ---
from .schemas import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    UserCreateResponse,
    UserGetResponse,
    UserListResponse,
    UserUpdateResponse,
)

load_dotenv()

router = APIRouter()

# --- LOGIN (Mantendo a versão DEV que é mais robusta com Log de IP) ---
@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
):
    # Extrai IP
    xff = request.headers.get("x-forwarded-for")
    if xff:
        ip = xff.split(",")[0].strip()
    else:
        client = request.client
        ip = client.host if client else None

    try:
        user_dict = auth_service.check_credentials(
            data.email, data.password, ip_address=ip
        )
    except HTTPException as he:
        return {"success": False, "user": None, "message": he.detail}

    if user_dict.get("is_active") is False:
        return {"success": False, "user": None, "message": "Acesso negado: Conta desativada."}

    return {"success": True, "user": user_dict, "message": "Login realizado com sucesso"}


# --- USERS (Mantendo a versão DEV que tem Auditoria e Permissões) ---
@router.post("/users", response_model=UserCreateResponse, status_code=201)
def create_user(
    data: UserCreateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Permissão negada.")
        
    created_user = user_service.create_new_user(data, performed_by=current_user.get("user_id"))
    return {"success": True, "user": created_user, "message": "Usuário cadastrado com sucesso!"}


@router.get("/users", response_model=UserListResponse)
def list_users(
    name: Optional[str] = None,
    email: Optional[str] = None,
    user_service: UserService = Depends(get_user_service),
):
    return user_service.get_formatted_users(name, email)


@router.get("/users/all", response_model=UserListResponse)
def get_all_users(user_service: UserService = Depends(get_user_service)):
    return user_service.get_formatted_users()


@router.get("/users/{user_id}", response_model=UserGetResponse)
def get_user_by_id(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
):
    user = user_service.get_user_by_id(user_id)
    return {"success": True, "user": user}


@router.put("/users/{user_id}", response_model=UserUpdateResponse)
def update_user(
    user_id: str,
    data: UserUpdateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    updated_user = user_service.update_existing_user(
        user_id, data, performed_by=current_user.get("user_id")
    )
    return {"success": True, "user": updated_user, "message": "Usuário atualizado com sucesso!"}


@router.delete("/users/{user_id}", status_code=204)
def delete_user_endpoint(
    user_id: str,
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Permissão negada.")
        
    service.delete_user_permanently(user_id, performed_by=current_user.get("user_id"))
    return None

# --- AUXILIARES E NOVAS ROTAS (DA FEATURE DASHBOARD) ---

@router.get("/suppliers", response_model=List[str])
def get_suppliers_list(user_service: UserService = Depends(get_user_service)):
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

# --- DASHBOARD ENDPOINTS (DA FEATURE DASHBOARD) ---

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

# --- NOVAS ROTAS DE AUDITORIA E LOGS (DA BRANCH DEV) ---

@router.get("/login-attempts")
def list_login_attempts(
    limit: int = 200,
    offset: int = 0,
    repo: IUserRepository = Depends(get_user_repository),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Apenas gestores podem acessar os registros.")

    logs = repo.get_login_attempts(limit=limit, offset=offset)
    return {"success": True, "logs": logs}

@router.get("/audit-logs")
def list_audit_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    date_from: Optional[str] = Query(None, alias="date_from"),
    date_to: Optional[str] = Query(None, alias="date_to"),
    limit: int = 200,
    offset: int = 0,
    audit_service: AuditService = Depends(get_audit_service),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Apenas gestores podem acessar os registros.")

    filters = {
        "user_id": user_id,
        "action": action,
        "entity": entity,
        "from": date_from,
        "to": date_to,
        "limit": limit,
        "offset": offset,
    }

    logs = audit_service.get_logs(filters)
    return {"success": True, "logs": logs}

@router.put("/me/password")
def change_own_password(
    data: ChangePasswordRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    user_service.change_password(
        user_id=current_user["user_id"],
        old_password=data.old_password,
        new_password=data.new_password,
        performed_by=current_user["user_id"]  # o próprio usuário
    )
    return {"success": True, "message": "Senha alterada com sucesso!"}