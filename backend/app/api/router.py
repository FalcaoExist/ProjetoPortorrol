from typing import Optional, List

from fastapi import APIRouter, Depends

# Importa dependências
from app.core.dependencies import get_auth_service, get_user_service

# Importa serviços
from app.services.auth_service import AuthService

# Importa modelos de request dos serviços
from app.services.service_models import UserCreateRequest, UserUpdateRequest
from app.services.user_service import UserService

# Importa modelos de response da API (schemas)
from .schemas import (
    LoginRequest,
    LoginResponse,
    UserCreateResponse,
    UserGetResponse,
    UserListResponse,
    UserUpdateResponse,
)

# cria o router
router = APIRouter()

# --- ENDPOINTS DA API ---

@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    # Tenta buscar o usuário e verificar senha.
    # Usamos try/except para garantir que, se o service lançar erro, 
    # nós capturamos e retornamos o JSON personalizado abaixo.
    try:
        user_dict = auth_service.check_credentials(data.email, data.password)
    except Exception:
        user_dict = None

    # CENÁRIO 1: Usuário não encontrado ou Senha Errada
    if not user_dict:
        return {
            "success": False,
            "user": None,
            "message": "E-mail ou senha incorretos."
        }

    # CENÁRIO 2: Senha correta, mas usuário DESATIVADO
    if user_dict.get("is_active") is False:
        return {
            "success": False,
            "user": None,
            "message": "Acesso negado: Sua conta está desativada. Contate o administrador.",
        }

    # CENÁRIO 3: Tudo certo
    return {
        "success": True,
        "user": user_dict,
        "message": "Login realizado com sucesso",
    }

@router.post("/users", response_model=UserCreateResponse, status_code=201)
def create_user(
    data: UserCreateRequest,
    user_service: UserService = Depends(get_user_service)
):
    created_user = user_service.create_new_user(data)
    return {
        "success": True,
        "user": created_user,
        "message": "Usuário cadastrado com sucesso!"
    }

@router.get("/users", response_model=UserListResponse)
def list_users(
    name: Optional[str] = None, 
    email: Optional[str] = None,
    user_service: UserService = Depends(get_user_service)
):
    return user_service.get_formatted_users(name, email)

@router.get("/users/all", response_model=UserListResponse)
def get_all_users(
    user_service: UserService = Depends(get_user_service)
):
    return user_service.get_formatted_users()

@router.get("/users/{user_id}", response_model=UserGetResponse)
def get_user_by_id(
    user_id: str,
    user_service: UserService = Depends(get_user_service)
):
    user = user_service.get_user_by_id(user_id)
    return {
        "success": True,
        "user": user
    }

@router.put("/users/{user_id}", response_model=UserUpdateResponse)
def update_user(
    user_id: str,
    data: UserUpdateRequest,
    user_service: UserService = Depends(get_user_service)
):
    updated_user = user_service.update_existing_user(user_id, data)
    return {
        "success": True,
        "user": updated_user,
        "message": "Usuário atualizado com sucesso!"
    }

@router.delete("/users/{user_id}", status_code=204)
def delete_user_endpoint(user_id: str, service: UserService = Depends(get_user_service)):
    service.delete_user_permanently(user_id)
    return None

# --- Endpoint de Fornecedores (NECESSÁRIO PARA O FRONTEND) ---
@router.get("/suppliers", response_model=List[str])
def get_suppliers_list(
    user_service: UserService = Depends(get_user_service)
):
    return user_service.get_available_suppliers()