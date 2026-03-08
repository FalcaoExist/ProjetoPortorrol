import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError, jwt 
import logging

from app.core.hashers import BcryptHasher
from app.core.interfaces import IPasswordHasher, IUserRepository
from app.repositories.repositories_supabase import SupabaseUserRepository

from app.services.audit_service import AuditService
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.supplier_service import SupplierService
from app.services.order_service import OrderService
from app.services.stock_service import StockService
from app.services.dashboard_service import DashboardService

from app.repositories.order_aggregate_repository import OrderAggregateRepository
from app.repositories.stock_repository import StockRepository

load_dotenv()
logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY deve ser definida nas variáveis de ambiente. Não use valor default em produção.")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# --- Provedores de Implementação ---

def get_user_repository() -> IUserRepository:
    return SupabaseUserRepository()

def get_password_hasher() -> IPasswordHasher:
    return BcryptHasher()

# --- Provedor de Auditoria ---

def get_audit_service(
    repo: IUserRepository = Depends(get_user_repository)
) -> AuditService:
    return AuditService(repo)

# --- Provedores de Serviço ---

def get_auth_service(
    repo: IUserRepository = Depends(get_user_repository),
    hasher: IPasswordHasher = Depends(get_password_hasher),
    audit_service: AuditService = Depends(get_audit_service),
) -> AuthService:
    return AuthService(repo, hasher, audit_service)

def get_user_service(
    repo: IUserRepository = Depends(get_user_repository),
    hasher: IPasswordHasher = Depends(get_password_hasher),
    audit_service: AuditService = Depends(get_audit_service),
) -> UserService:
    return UserService(repo, hasher, audit_service)

def get_supplier_service(
    audit_service: AuditService = Depends(get_audit_service),
) -> SupplierService:
    return SupplierService(audit_service)

def get_order_service(
    audit_service: AuditService = Depends(get_audit_service),
) -> OrderService:
    return OrderService(audit_service)

def get_order_aggregate_repository():
    return OrderAggregateRepository()

def get_stock_service() -> StockService:
    repo = StockRepository()
    return StockService(stock_repository=repo)

def get_dashboard_service(
    audit_service: AuditService = Depends(get_audit_service),
) -> DashboardService:
    return DashboardService(audit_service=audit_service)

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

    try:
        if hasattr(repo, 'get_suppliers_for_user'):
            suppliers = repo.get_suppliers_for_user(user_id)
            user['supplier'] = suppliers or []
    except Exception as e:
        logger.warning("Aviso: falha ao carregar suppliers para user %s - Erro: %s", user_id, str(e))

    return user