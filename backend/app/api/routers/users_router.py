from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException
from app.core.dependencies import get_current_user, get_user_service
from app.services.user_service import UserService
from app.services.service_models import UserCreateRequest, UserUpdateRequest
from app.api.schemas import UserCreateResponse, UserGetResponse, UserListResponse, UserUpdateResponse

router = APIRouter()

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
def list_users(name: Optional[str] = None, email: Optional[str] = None, user_service: UserService = Depends(get_user_service)):
    return user_service.get_formatted_users(name, email)

@router.get("/users/{user_id}", response_model=UserGetResponse)
def get_user_by_id(user_id: str, user_service: UserService = Depends(get_user_service)):
    user = user_service.get_user_by_id(user_id)
    return {"success": True, "user": user}

@router.put("/users/{user_id}", response_model=UserUpdateResponse)
def update_user(
    user_id: str, data: UserUpdateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    updated_user = user_service.update_existing_user(user_id, data, performed_by=current_user.get("user_id"))
    return {"success": True, "user": updated_user, "message": "Usuário atualizado com sucesso!"}

@router.delete("/users/{user_id}", status_code=204)
def delete_user_endpoint(user_id: str, service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Permissão negada.")
    service.delete_user_permanently(user_id, performed_by=current_user.get("user_id"))
    return None
