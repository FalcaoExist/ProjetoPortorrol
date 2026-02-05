from typing import Any, Dict, Optional

from fastapi import HTTPException, status

from app.core.interfaces import IPasswordHasher, IUserRepository

from app.audit.audit_actions import AuditAction

class AuthService:

    def __init__(self, user_repo: IUserRepository, hasher: IPasswordHasher):
        self.user_repo = user_repo
        self.hasher = hasher

    def check_credentials(self, email: str, password: str, ip_address: Optional[str] = None) -> Dict[str, Any]:
        user = self.user_repo.get_user_by_email(email.lower())

        # REGISTRA TENTATIVA (FALHA: Usuário não existe)
        if not user:
            try:
                self.user_repo.insert_login_attempt(email_attempted=email.lower(), success=False, user_id=None, ip_address=ip_address)
            except Exception: 
                pass
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")

        # REGISTRA TENTATIVA (FALHA: Usuário Inativo)
        if not user.get("is_active", False):
            try:
                self.user_repo.insert_login_attempt(email_attempted=email.lower(), success=False, user_id=user.get("user_id"), ip_address=ip_address)
            except Exception: 
                pass
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário desativado.")

        # REGISTRA TENTATIVA (FALHA: Senha Incorreta)
        if not self.hasher.verify(password, user["password_hash"]):
            try:
                self.user_repo.insert_login_attempt(email_attempted=email.lower(), success=False, user_id=user.get("user_id"), ip_address=ip_address)
            except Exception: 
                pass
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")
        
        # REGISTRA TENTATIVA (SUCESSO)
        try:
            self.user_repo.insert_login_attempt(email_attempted=email.lower(), success=True, user_id=user.get("user_id"), ip_address=ip_address)
            self.user_repo.insert_audit_log(performed_by=user.get("user_id"), action=AuditAction.LOGIN, entity="users", entity_id=user.get("user_id"), extra={})
        except Exception: 
            pass

        user.pop("password_hash", None)
        return user