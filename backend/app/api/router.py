from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

# Importa dependências
from app.core.dependencies import (
    get_audit_service,
    get_auth_service,
    get_current_user,
    get_user_repository,
    get_user_service,
)
from app.core.interfaces import IUserRepository
from app.services.audit_service import AuditService

# Importa serviços
from app.services.auth_service import AuthService
from app.services.service_models import UserCreateRequest, UserUpdateRequest
from app.services.user_service import UserService

# Importa schemas
from .schemas import (
    LoginRequest,
    LoginResponse,
    UserCreateResponse,
    UserGetResponse,
    UserListResponse,
    UserUpdateResponse,
)

router = APIRouter()

# --- LOGIN ---
@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        user_dict = auth_service.check_credentials(data.email, data.password)
    except Exception:
        user_dict = None

    if not user_dict:
        return {"success": False, "user": None, "message": "E-mail ou senha incorretos."}

    if user_dict.get("is_active") is False:
        return {"success": False, "user": None, "message": "Acesso negado: Conta desativada."}

    return {"success": True, "user": user_dict, "message": "Login realizado com sucesso"}

# --- USERS ---

@router.post("/users", response_model=UserCreateResponse, status_code=201)
def create_user(
    data: UserCreateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Permissão negada.")
        
    created_user = user_service.create_new_user(data, performed_by=current_user.get("user_id"))
    return {"success": True, "user": created_user, "message": "Usuário cadastrado com sucesso!"}

@router.get("/users", response_model=UserListResponse)
def list_users(
    name: Optional[str] = None, 
    email: Optional[str] = None,
    user_service: UserService = Depends(get_user_service)
):
    return user_service.get_formatted_users(name, email)

@router.get("/users/all", response_model=UserListResponse)
def get_all_users(user_service: UserService = Depends(get_user_service)):
    return user_service.get_formatted_users()

@router.get("/users/{user_id}", response_model=UserGetResponse)
def get_user_by_id(
    user_id: str,
    user_service: UserService = Depends(get_user_service)
):
    user = user_service.get_user_by_id(user_id)
    return {"success": True, "user": user}

@router.put("/users/{user_id}", response_model=UserUpdateResponse)
def update_user(
    user_id: str,
    data: UserUpdateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user)
):
    updated_user = user_service.update_existing_user(
        user_id, data, performed_by=current_user.get("user_id")
    )
    return {"success": True, "user": updated_user, "message": "Usuário atualizado com sucesso!"}

@router.delete("/users/{user_id}", status_code=204)
def delete_user_endpoint(
    user_id: str, 
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Permissão negada.")
        
    service.delete_user_permanently(user_id, performed_by=current_user.get("user_id"))
    return None

# --- UTILITÁRIOS & LOGS ---

@router.get("/check-email")
def check_email(email: str, repo: IUserRepository = Depends(get_user_repository)):
    user = repo.get_user_by_email(email)
    return {"exists": user is not None}

@router.get("/suppliers", response_model=List[str])
def get_suppliers_list(user_service: UserService = Depends(get_user_service)):
    return user_service.get_available_suppliers()

@router.get("/audit-logs")
def list_audit_logs(
    # [CORREÇÃO] Adicionados os parâmetros que faltavam para o filtro funcionar
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    date_from: Optional[str] = Query(None, alias="date_from"), # Mapeia 'date_from' da URL para essa var
    date_to: Optional[str] = Query(None, alias="date_to"),     # Mapeia 'date_to' da URL para essa var
    limit: int = 200,
    offset: int = 0,
    audit_service: AuditService = Depends(get_audit_service),
    current_user: dict = Depends(get_current_user),
):
    """
    Busca logs de auditoria. Exclusivo para gestores.
    """
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Apenas gestores podem acessar os registros.")

    # Monta o dicionário de filtros que o repositório espera
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