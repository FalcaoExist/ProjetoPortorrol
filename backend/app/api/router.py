from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

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
from app.services.service_models import UserCreateRequest, UserUpdateRequest
from app.services.user_service import UserService

from .schemas import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    UserCreateResponse,
    UserGetResponse,
    UserListResponse,
    UserUpdateResponse,
)

router = APIRouter()


# --- LOGIN ---
# >>> ALTERAÇÃO: agora captura IP e envia para AuthService
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


# --- USERS ---
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


# --- LOGIN ATTEMPTS (NOVO ENDPOINT) ---
# >>> ALTERAÇÃO: retorna todas as tentativas de login (sucesso + falha)
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


# --- SUPPLIERS ---
@router.get("/suppliers", response_model=List[str])
def get_suppliers_list(user_service: UserService = Depends(get_user_service)):
    return user_service.get_available_suppliers()


# --- AUDIT LOGS ---
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

# TROCA DE SENHA
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
