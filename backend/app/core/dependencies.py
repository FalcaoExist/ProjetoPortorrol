from fastapi import Depends, Header, HTTPException, status

from app.core.hashers import BcryptHasher
from app.core.interfaces import IPasswordHasher, IUserRepository

# Importa as implementações
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.services.audit_service import AuditService  # <--- NOVO IMPORT

# Importa os Serviços
from app.services.auth_service import AuthService
from app.services.user_service import UserService

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

def get_current_user(
    x_user_id: str = Header(..., alias="X-User-Id"),
    repo: IUserRepository = Depends(get_user_repository)
):
    user = repo.get_user_by_id(x_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não autenticado.")
    return user

# --- NOVO PROVEDOR DE AUDITORIA ---
def get_audit_service(repo: IUserRepository = Depends(get_user_repository)) -> AuditService:
    return AuditService(repo)