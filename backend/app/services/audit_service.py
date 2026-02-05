from app.audit.audit_formatter import format_audit_log

class AuditService:
    def __init__(self, repo):
        self.repo = repo

    def get_logs(self, filters):
        raw_logs = self.repo.get_audit_logs(filters)
        return [format_audit_log(log) for log in raw_logs]