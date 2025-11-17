from fastapi import Depends
from app.core.interfaces import IUserRepository, IPasswordHasher

# Importa as implementações
from app.repositories.repositories_supabase import SupabaseUserRepository
from app.core.hashers import BcryptHasher

# Importa os Serviços que precisam das dependências
from app.services.auth_service import AuthService
from app.services.user_service import UserService

# --- Provedores de Implementação (DIP) ---
# Esta seção "ensina" ao FastAPI como resolver as Interfaces.

def get_user_repository() -> IUserRepository:
    """
    Provedor de Dependência (DIP).
    Quando um endpoint pedir por 'IUserRepository', o FastAPI
    executará esta função e injetará um 'SupabaseUserRepository'.
    
    Se quisermos mudar para o JSON, só precisamos mudar esta linha:
    return JsonUserRepository()
    E o resto da aplicação continuará funcionando.
    """
    return SupabaseUserRepository()

def get_password_hasher() -> IPasswordHasher:
    """
    Provedor de Dependência (DIP).
    Quando um endpoint pedir por 'IPasswordHasher', o FastAPI
    executará esta função e injetará um 'BcryptHasher'.
    """
    return BcryptHasher()

# --- Provedores de Serviço ---
# Esta seção constrói os serviços, injetando as dependências acima.

def get_auth_service(
    # Pede ao FastAPI: "Me dê o que 'get_user_repository' retorna"
    repo: IUserRepository = Depends(get_user_repository),
    # Pede ao FastAPI: "Me dê o que 'get_password_hasher' retorna"
    hasher: IPasswordHasher = Depends(get_password_hasher)
) -> AuthService:
    """
    Provedor que constrói e retorna uma instância do AuthService.
    Ele automaticamente resolve as dependências (repo, hasher)
    e as passa para o __init__ do AuthService.
    """
    return AuthService(repo, hasher)

def get_user_service(
    repo: IUserRepository = Depends(get_user_repository),
    hasher: IPasswordHasher = Depends(get_password_hasher)
) -> UserService:
    """
    Provedor que constrói e retorna uma instância do UserService.
    """
    return UserService(repo, hasher)