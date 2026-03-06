from datetime import datetime
from typing import Any, Dict, Optional
from app.audit.audit_actions import AuditAction
from app.audit.audit_messages import AUDIT_MESSAGES

def format_audit_log(
    action: AuditAction,
    performed_by: Optional[str],
    entity: Optional[str],
    entity_id: Optional[str],
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:

    message_config = AUDIT_MESSAGES.get(action)

    details = _normalize_details(extra)

    if not message_config:
        return {
            "category": "UNKNOWN",
            "action": action.value if hasattr(action, "value") else str(action),
            "label": "Ação não mapeada",
            "severity": "INFO",
            "performed_by": performed_by,
            "entity": entity,
            "entity_id": entity_id,
            "details": details,
            "message": _build_human_message("Ação registrada", details, performed_by),
        }

    severity = (message_config.severity or "INFO").upper()

    return {
        "category": message_config.category,
        "action": action.value,
        "label": message_config.label,
        "description": message_config.description,
        "severity": severity,
        "performed_by": performed_by,
        "entity": entity,
        "entity_id": entity_id,
        "details": details,
        "message": _build_action_message(
            action,
            message_config.label,
            details,
            performed_by
        ),
    }

def _normalize_details(extra: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not extra:
        return {}

    return {k: v for k, v in extra.items() if v is not None}

def _build_action_message(
    action: AuditAction,
    label: str,
    details: Dict[str, Any],
    performed_by: Optional[str],
) -> str:

    user = performed_by or "Sistema"

    # LOGIN
    if action == AuditAction.LOGIN_SUCCESS:
        return f"{user} realizou login no sistema"

    if action == AuditAction.LOGIN_FAILURE:
        return f"Tentativa de login falhou para {user}"

    # USER
    if action == AuditAction.USER_CREATE:
        name = details.get("name")
        return f"{user} criou o usuário {name}" if name else f"{user} criou um usuário"

    if action == AuditAction.USER_DELETE:
        email = details.get("email")
        return f"{user} removeu o usuário {email}" if email else f"{user} removeu um usuário"

    if action == AuditAction.USER_PASSWORD_UPDATE:
        return f"{user} alterou a própria senha"

    # SUPPLIER
    if action == AuditAction.SUPPLIER_CREATE:
        name = details.get("name")
        return f"{user} criou o fornecedor {name}" if name else f"{user} criou um fornecedor"

    if action == AuditAction.SUPPLIER_DELETE:
        name = details.get("name")
        return f"{user} desativou o fornecedor {name}" if name else f"{user} desativou um fornecedor"

    # ORDER
    if action == AuditAction.ORDER_CREATE:
        return f"{user} criou um novo pedido"

    if action == AuditAction.ORDER_STATUS_CHANGE:
        old = details.get("old_status")
        new = details.get("new_status")
        if old and new:
            return f"{user} alterou status do pedido de {old} para {new}"
        return f"{user} alterou o status de um pedido"

    # IMPORT
    if action == AuditAction.IMPORT_SUCCESS:
        total = details.get("processed")
        if total:
            return f"{user} importou arquivo com sucesso ({total} registros)"
        return f"{user} concluiu uma importação"

    if action == AuditAction.IMPORT_FAILURE:
        return f"{user} tentou importar um arquivo mas ocorreu erro"

    # fallback
    return _build_human_message(label, details, performed_by)

def _build_human_message(
    label: str,
    details: Dict[str, Any],
    performed_by: Optional[str],
) -> str:

    base = f"{performed_by} - {label}" if performed_by else label

    if not details:
        return base

    if {"field", "old_value", "new_value"} <= details.keys():
        return (
            f"{base} | "
            f"{details['field']} alterado de "
            f"{details['old_value']} para {details['new_value']}"
        )

    if {"old_status", "new_status"} <= details.keys():
        return (
            f"{base} | "
            f"Status alterado de {details['old_status']} "
            f"para {details['new_status']}"
        )

    detail_str = ", ".join(f"{k}: {v}" for k, v in details.items())
    return f"{base} | {detail_str}"