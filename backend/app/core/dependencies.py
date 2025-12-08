import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt

from app.core.hashers import BcryptHasher
from app.core.interfaces import IPasswordHasher, IUserRepository
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.services.auth_service import AuthService
from app.services.user_service import UserService

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "uma_chave_super_secreta_e_segura_123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")



def get_user_repository() -> IUserRepository:
    return SupabaseUserRepository()

def get_password_hasher() -> IPasswordHasher:
    return BcryptHasher()

def get_auth_service(
    repo: IUserRepository = Depends(get_user_repository),
    hasher: IPasswordHasher = Depends(get_password_hasher)
) -> AuthService:
    return AuthService(repo, hasher)

def get_user_service(
    repo: IUserRepository = Depends(get_user_repository),
    hasher: IPasswordHasher = Depends(get_password_hasher)
) -> UserService:
    return UserService(repo, hasher)

def get_current_user(
    access_token: Optional[str] = Cookie(None), 
    repo: IUserRepository = Depends(get_user_repository)
):
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou sessão expirada.",
    )

    if not access_token:
        raise credentials_exception

    token_str = access_token.replace("Bearer ", "") if access_token.startswith("Bearer ") else access_token

    try:
        payload = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    user = repo.get_user_by_id(user_id)
    if not user:
        raise credentials_exception
        
    return user