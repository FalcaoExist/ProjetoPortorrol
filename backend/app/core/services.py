from fastapi import HTTPException, status

from .interfaces import IPasswordHasher, IUserRepository


class AuthService:
    """Serviço responsável pela autenticação de usuários."""

    def __init__(self, user_repo: IUserRepository, hasher: IPasswordHasher):
        self.user_repo = user_repo
        self.hasher = hasher

    def check_credentials(self, email: str, password: str):
        user = self.user_repo.get_user_by_email(email)

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")

        if user.get("status") != "ativo":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário desativado.")

        if not self.hasher.verify(password, user["password"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")

        return user
