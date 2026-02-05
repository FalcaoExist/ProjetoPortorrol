import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt  # CORRIGIDO: O import estava quebrado com uma URL

from app.core.hashers import BcryptHasher
from app.core.interfaces import IPasswordHasher, IUserRepository
from app.repositories.repositories_supabase import SupabaseUserRepository

# Serviços
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService
from app.services.user_service import UserService

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "uma_chave_super_secreta_e_segura_123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# --- Provedores de Implementação ---

def get_user_repository() -> IUserRepository:
    return SupabaseUserRepository()

def get_password_hasher() -> IPasswordHasher:
    return BcryptHasher()

# --- Provedores de Serviço ---

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

def get_audit_service(
    repo: IUserRepository = Depends(get_user_repository)
) -> AuditService:
    return AuditService(repo)

# --- Dependência de Autenticação (JWT) ---

def get_current_user(
    access_token: Optional[str] = Cookie(None), 
    repo: IUserRepository = Depends(get_user_repository)
):
    """
    Valida o token JWT vindo do Cookie e retorna o usuário atual.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou sessão expirada.",
    )

    if not access_token:
        raise credentials_exception

    # Remove 'Bearer ' se estiver presente (comum em headers, mas prevenindo no cookie)
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
    # Tenta anexar a lista de fornecedores associados ao usuário
    try:
        # Alguns repositórios implementam get_suppliers_for_user
        if hasattr(repo, 'get_suppliers_for_user'):
            suppliers = repo.get_suppliers_for_user(user_id)
            # Normaliza para lista (pode ser vazio)
            user['supplier'] = suppliers or []
    except Exception:
        print(f"Aviso: falha ao carregar suppliers para user {user_id}")

    return user