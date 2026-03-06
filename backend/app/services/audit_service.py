import logging
from typing import Optional, Dict, Any
from app.audit.audit_actions import AuditAction
from app.audit.audit_formatter import format_audit_log
from app.audit.audit_messages import AUDIT_MESSAGES
from app.core.interfaces import IUserRepository

logger = logging.getLogger(__name__)

class AuditService:
    """
    Serviço centralizado de auditoria.

    Responsabilidades:
    - Formatar evento de auditoria
    - Persistir log via repository
    - Garantir que falha na auditoria NÃO interrompa regra de negócio
    """
    def __init__(self, user_repository: IUserRepository):
        self.user_repository = user_repository

    def log(
        self,
        action: AuditAction,
        performed_by: Optional[str],
        entity: Optional[str] = None,
        entity_id: Optional[str] = None,
        extra: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Registra evento de auditoria.
        Nunca levanta exceção.
        """
        try:
            formatted_log = format_audit_log(
                action=action,
                performed_by=performed_by,
                entity=entity,
                entity_id=entity_id,
                extra=extra,
            )

            self._persist(formatted_log)

        except Exception:
            logger.exception(
                "Falha inesperada ao processar evento de auditoria",
                extra={
                    "action": action.value,
                    "entity": entity,
                    "entity_id": entity_id,
                },
            )

    def _persist(self, formatted_log: Dict[str, Any]) -> None:
        """
        Persiste o log no repositório.
        """
        try:
            self.user_repository.insert_audit_log(
                performed_by=formatted_log.get("performed_by"),
                action=formatted_log.get("action"),
                entity=formatted_log.get("entity"),
                entity_id=formatted_log.get("entity_id"),
                extra=formatted_log.get("details") or {},
            )

        except Exception:
            logger.exception(
                "Falha ao persistir log de auditoria",
                extra={
                    "action": formatted_log.get("action"),
                    "entity": formatted_log.get("entity"),
                    "entity_id": formatted_log.get("entity_id"),
                },
            )

    def get_logs(self, filters: Dict[str, Any]):
        """
        Retorna logs formatados para consumo do frontend.
        Usa as definições de AUDIT_MESSAGES para garantir consistência.
        """
        raw_logs = self.user_repository.get_audit_logs(filters)

        formatted_logs = []

        for log in raw_logs:
            action_str = (log.get("action") or "").strip().upper()

            try:
                action_enum = AuditAction(action_str)
                message_cfg = AUDIT_MESSAGES.get(action_enum)
            except Exception:
                continue

            if not message_cfg:
                continue

            formatted_logs.append(
                {
                    "log_id": log.get("log_id"),
                    "user_name": log.get("user_name"),
                    "created_at": log.get("created_at"),
                    "action_label": message_cfg.label if message_cfg else action_str,
                    "severity": message_cfg.severity if message_cfg else "INFO",
                    "description": message_cfg.description if message_cfg else action_str,
                }
            )

        return formatted_logs