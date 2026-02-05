from .audit_messages import AUDIT_MESSAGES

def format_audit_log(log: dict) -> dict:
    action = log.get("action")
    config = AUDIT_MESSAGES.get(action, {})

    description = log.get("description")
    if not isinstance(description, str):
        description = None

    severity = config.get("severity", "INFO")
    if not isinstance(severity, str):
        severity = "INFO"

    return {
        **log,
        "action_label": config.get("label", action or "-"),
        "severity": severity.upper(),
        "description": (
            description
            or config.get("default_description")
            or "-"
        ),
    }