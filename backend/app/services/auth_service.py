from typing import Any, Dict

from fastapi import HTTPException, status

from app.core.interfaces import IPasswordHasher, IUserRepository


class AuthService:

    def __init__(self, user_repo: IUserRepository, hasher: IPasswordHasher):
        self.user_repo = user_repo
        self.hasher = hasher

    def check_credentials(self, email: str, password: str) -> Dict[str, Any]:
        user = self.user_repo.get_user_by_email(email.lower())

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")

        if not user.get("is_active", False):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário desativado.")

        if not self.hasher.verify(password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")
        
        user.pop("password_hash", None)

        return user