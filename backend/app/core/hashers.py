import bcrypt
from .interfaces import IPasswordHasher

class BcryptHasher(IPasswordHasher):
    def verify(self, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
