import os
from datetime import datetime, timedelta
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, Response, status
from jose import jwt

from app.core.dependencies import get_auth_service, get_current_user, get_user_service
from app.services.auth_service import AuthService
from app.services.service_models import UserCreateRequest, UserUpdateRequest
from app.services.user_service import UserService

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
    """Cria o token JWT assinado"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=LoginResponse)
def login(
    response: Response, # Necessário para manipular Cookies
    data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):

    # 1. Verifica as credenciais
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
    
    # 2. Gera o Token JWT
    token_data = {
        "sub": str(user_dict.get("user_id")),
        "role": user_dict.get("role")        
    }
    access_token = create_access_token(token_data)
    # 3. Define o cookie HttpOnly no response
    response.set_cookie(
        key="access_token",            
        value=f"Bearer {access_token}",
        httponly=True,             
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",           
        secure=False,              
        path="/"                   
    )

    return {
        "success": True,
        "user": user_dict,
        "message": "Login realizado com sucesso",
    }

@router.post("/logout")
def logout(response: Response):
    """Remove o cookie do navegador"""
    response.delete_cookie("access_token")
    return {"success": True, "message": "Logout realizado"}

@router.post("/users", response_model=UserCreateResponse, status_code=201)
def create_user(
    data: UserCreateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user) 
):
    created_user = user_service.create_new_user(data)
    return { "success": True, "user": created_user, "message": "Criado com sucesso!" }

@router.get("/users", response_model=UserListResponse)
def list_users(
    name: Optional[str] = None, 
    email: Optional[str] = None,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user) 
):
    return user_service.get_formatted_users(name, email)

@router.get("/users/all", response_model=UserListResponse)
def get_all_users(
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user) 
):
    return user_service.get_formatted_users()

@router.get("/users/{user_id}", response_model=UserGetResponse)
def get_user_by_id(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user) 
):
    user = user_service.get_user_by_id(user_id)
    return { "success": True, "user": user }

@router.put("/users/{user_id}", response_model=UserUpdateResponse)
def update_user(
    user_id: str,
    data: UserUpdateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user) 
):
    updated_user = user_service.update_existing_user(user_id, data)
    return { "success": True, "user": updated_user, "message": "Atualizado com sucesso!" }

@router.delete("/users/{user_id}", status_code=204)
def delete_user_endpoint(
    user_id: str, 
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user) 
):
    service.delete_user_permanently(user_id)
    return None

@router.get("/suppliers", response_model=List[str])
def get_suppliers_list(
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user)
):
    return user_service.get_available_suppliers()


@router.get("/me", response_model=UserGetResponse)
def get_current_user_profile(
    current_user: dict = Depends(get_current_user) 
):

    return {
        "success": True,
        "user": current_user
    }