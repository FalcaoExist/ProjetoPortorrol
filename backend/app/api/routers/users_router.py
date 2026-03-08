from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import get_current_user, get_user_service
from app.services.user_service import UserService
from app.services.service_models import UserCreateRequest, UserUpdateRequest
from app.api.schemas import UserCreateResponse, UserGetResponse, UserListResponse, UserUpdateResponse

router = APIRouter(tags=["Users"])


def _ensure_gestor(current_user: dict) -> None:
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Permissão negada.")

@router.post(
    "/users",
    response_model=UserCreateResponse,
    status_code=201,
    summary="Criar usuário",
    description="Cria um novo usuário. Requer perfil gestor.",
    responses={
        201: {
            "description": "Usuário criado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "user": {
                            "user_id": "00000000-0000-4000-8000-000000000101",
                            "name": "Novo Usuário Demo",
                            "email": "new.user@example.test",
                            "role": "comprador",
                            "supplier": ["SUPPLIER_DEMO_A"],
                            "is_active": True,
                        },
                        "message": "Usuário cadastrado com sucesso!",
                    }
                }
            },
        },
        403: {"description": "Permissão negada"},
        422: {"description": "Payload inválido"},
    },
)
def create_user(
    data: UserCreateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    _ensure_gestor(current_user)
    created_user = user_service.create_new_user(data, performed_by=current_user.get("user_id"))
    return {"success": True, "user": created_user, "message": "Usuário cadastrado com sucesso!"}

@router.get(
    "/users",
    response_model=UserListResponse,
    summary="Listar usuários",
    description="Retorna lista paginada de usuários com filtros opcionais por nome e email.",
    responses={
        200: {
            "description": "Usuários retornados com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "users": [
                            {
                                "user_id": "00000000-0000-4000-8000-000000000100",
                                "name": "Usuário Demo",
                                "email": "user@example.test",
                                "role": "gestor",
                                "is_active": True,
                                "supplier": ["SUPPLIER_DEMO_A"],
                            }
                        ],
                        "total": 1,
                    }
                }
            },
        },
        422: {"description": "Parâmetros inválidos"},
    },
)
def list_users(
    name: Optional[str] = Query(default=None, description="Filtrar por nome"),
    email: Optional[str] = Query(default=None, description="Filtrar por email"),
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    _ensure_gestor(current_user)
    return user_service.get_formatted_users(name, email)

@router.get(
    "/users/{user_id}",
    response_model=UserGetResponse,
    summary="Obter usuário por ID",
    description="Retorna os dados de um usuário específico.",
    responses={
        200: {
            "description": "Usuário retornado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "user": {
                            "user_id": "00000000-0000-4000-8000-000000000100",
                            "name": "Usuário Demo",
                            "email": "user@example.test",
                            "role": "gestor",
                            "supplier": ["SUPPLIER_DEMO_A"],
                            "is_active": True,
                        },
                    }
                }
            },
        },
        404: {"description": "Usuário não encontrado"},
    },
)
def get_user_by_id(user_id: str, user_service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    _ensure_gestor(current_user)
    user = user_service.get_user_by_id(user_id)
    return {"success": True, "user": user}

@router.put(
    "/users/{user_id}",
    response_model=UserUpdateResponse,
    summary="Atualizar usuário",
    description="Atualiza dados de um usuário existente. Requer perfil gestor.",
    responses={
        200: {
            "description": "Usuário atualizado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "user": {
                            "user_id": "00000000-0000-4000-8000-000000000100",
                            "name": "Usuário Demo Atualizado",
                            "email": "user.updated@example.test",
                            "role": "gestor",
                            "supplier": ["SUPPLIER_DEMO_A"],
                            "is_active": True,
                        },
                        "message": "Usuário atualizado com sucesso!",
                    }
                }
            },
        },
        403: {"description": "Permissão negada"},
        404: {"description": "Usuário não encontrado"},
        422: {"description": "Payload inválido"},
    },
)
def update_user(
    user_id: str, data: UserUpdateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    _ensure_gestor(current_user)
        
    updated_user = user_service.update_existing_user(user_id, data, performed_by=current_user.get("user_id"))
    return {"success": True, "user": updated_user, "message": "Usuário atualizado com sucesso!"}


@router.delete(
    "/users/{user_id}",
    status_code=204,
    summary="Excluir usuário",
    description="Remove permanentemente um usuário. Requer perfil gestor.",
    responses={
        204: {
            "description": "Usuário excluído com sucesso",
            "content": {
                "application/json": {
                    "example": None
                }
            },
        },
        403: {"description": "Permissão negada"},
        404: {"description": "Usuário não encontrado"},
    },
)
def delete_user_endpoint(user_id: str, service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    _ensure_gestor(current_user)
    service.delete_user_permanently(user_id, performed_by=current_user.get("user_id"))
    return None
