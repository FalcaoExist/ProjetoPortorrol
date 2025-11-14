from abc import ABC, abstractmethod


class IUserRepository(ABC):
    @abstractmethod
    def get_user_by_email(self, email: str):
        pass


class IPasswordHasher(ABC):
    @abstractmethod
    def verify(self, plain_password: str, hashed_password: str) -> bool:
        pass
