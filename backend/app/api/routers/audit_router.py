from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import get_audit_service, get_current_user, get_user_repository
from app.core.interfaces import IUserRepository
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/login-attempts")
def list_login_attempts(limit: int = 200, offset: int = 0, repo: IUserRepository = Depends(get_user_repository), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "gestor": raise HTTPException(403, "Acesso negado.")
    return {"success": True, "logs": repo.get_login_attempts(limit=limit, offset=offset)}

@router.get("/audit-logs")
def list_audit_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    date_from: Optional[str] = Query(None, alias="date_from"),
    date_to: Optional[str] = Query(None, alias="date_to"),
    limit: int = 200,
    offset: int = 0,
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