from typing import Any, Dict, List

from app.core.interfaces import IUserRepository


class AuditService:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    def get_logs(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        return self.repo.get_audit_logs(filters)