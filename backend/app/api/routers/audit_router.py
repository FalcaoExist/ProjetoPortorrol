from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import get_audit_service, get_current_user, get_user_repository
from app.core.interfaces import IUserRepository
from app.services.audit_service import AuditService
from app.api.schemas import AuditListResponse

router = APIRouter(tags=["Audit"])

@router.get(
    "/login-attempts",
    response_model=AuditListResponse,
    summary="Listar tentativas de login",
    description="Retorna tentativas de login registradas no sistema. Requer perfil gestor.",
    responses={
        200: {
            "description": "Logs retornados com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "logs": [
                            {
                                "id": "00000000-0000-4000-8000-000000000300",
                                "email": "user@example.test",
                                "ip_address": "127.0.0.1",
                                "success": True,
                                "created_at": "2026-04-01T10:00:00Z",
                            }
                        ],
                    }
                }
            },
        },
        403: {"description": "Acesso negado"},
    },
)
def list_login_attempts(
    limit: int = Query(default=200, ge=1, description="Quantidade máxima de registros"),
    offset: int = Query(default=0, ge=0, description="Deslocamento para paginação"),
    repo: IUserRepository = Depends(get_user_repository),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor": raise HTTPException(403, "Acesso negado.")
    return {"success": True, "logs": repo.get_login_attempts(limit=limit, offset=offset)}

@router.get(
    "/audit-logs",
    summary="Listar logs de auditoria",
    description="Retorna logs de auditoria com filtros opcionais por usuário, ação, entidade e período. Requer perfil gestor.",
    responses={
        200: {
            "description": "Logs retornados com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "logs": [
                            {
                                "id": "00000000-0000-4000-8000-000000000301",
                                "action": "USER_UPDATE",
                                "entity": "USER",
                                "entity_id": "00000000-0000-4000-8000-000000000100",
                                "performed_by": "00000000-0000-4000-8000-000000000100",
                                "created_at": "2026-04-01T11:00:00Z",
                            }
                        ],
                    }
                }
            },
        },
        403: {"description": "Acesso negado"},
    },
)
def list_audit_logs(
    user_id: Optional[str] = Query(default=None, description="Filtrar por usuário"),
    action: Optional[str] = Query(default=None, description="Filtrar por ação"),
    entity: Optional[str] = Query(default=None, description="Filtrar por entidade"),
    date_from: Optional[str] = Query(default=None, alias="date_from", description="Data inicial (ISO)"),
    date_to: Optional[str] = Query(default=None, alias="date_to", description="Data final (ISO)"),
    limit: int = Query(default=200, ge=1, description="Quantidade máxima de registros"),
    offset: int = Query(default=0, ge=0, description="Deslocamento para paginação"),
    audit_service: AuditService = Depends(get_audit_service),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Acesso negado.")

    filters = {
        "user_id": user_id,
        "action": action,
        "entity": entity,
        "from": date_from,
        "to": date_to,
        "limit": limit,
        "offset": offset,
    }

    return audit_service.get_logs(filters)