from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class IUserRepository(ABC):
    
    @abstractmethod
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_all_users(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def create_user(self, user_data: dict) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def update_user(self, user_id: str, updates: dict) -> Dict[str, Any]:
        pass

    @abstractmethod
    def sync_user_suppliers(self, user_id: str, supplier_ids: List[str]) -> None:
        pass

    @abstractmethod
    def get_suppliers_for_user(self, user_id: str) -> List[str]:
        pass

    @abstractmethod
    def get_all_suppliers(self) -> List[str]:
        pass


class IPasswordHasher(ABC):
    
    @abstractmethod
    def verify(self, plain_password: str, hashed_password: str) -> bool:
        pass
        
    @abstractmethod
    def hash(self, plain_password: str) -> str:
        pass