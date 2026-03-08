import uuid
import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from app.core.interfaces import IPasswordHasher, IUserRepository
from .service_models import UserCreateRequest, UserUpdateRequest
from app.audit.audit_actions import AuditAction
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

class UserService:

    def __init__(self, user_repo: IUserRepository, hasher: IPasswordHasher, audit_service: AuditService):
        self.user_repo = user_repo
        self.hasher = hasher
        self.audit_service = audit_service

    def create_new_user(
        self,
        data: UserCreateRequest,
        performed_by: Optional[str] = None
    ) -> Dict[str, Any]:

        if self.user_repo.get_user_by_email(data.email.lower()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="E-mail já cadastrado no sistema.",
            )

        new_user_data_db = {
            "user_id": str(uuid.uuid4()),
            "name": data.name,
            "email": data.email.lower(),
            "password_hash": self.hasher.hash(data.password),
            "role": data.role,
            "is_active": True
        }

        try:

            created_user = self.user_repo.create_user(new_user_data_db)
            new_user_id = created_user["user_id"]

            if data.supplier:
                self.user_repo.sync_user_suppliers(new_user_id, data.supplier)

            created_user.pop("password_hash", None)
            created_user["supplier"] = data.supplier

            self.audit_service.log(
                action=AuditAction.USER_CREATE,
                performed_by=performed_by or new_user_id,
                entity="USER",
                entity_id=new_user_id,
                extra={
                    "name": created_user["name"],
                    "role": created_user["role"]
                }
            )

            return created_user

        except Exception:
            logger.exception("Erro ao criar usuário - email: %s", data.email)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao salvar usuário.",
            )

    def get_formatted_users(
        self,
        name: Optional[str] = None,
        email: Optional[str] = None
    ) -> Dict[str, Any]:

        try:

            all_users = self.user_repo.get_all_users()
            filtered_users = all_users

            if name:
                filtered_users = [
                    u for u in filtered_users
                    if name.lower() in u.get("name", "").lower()
                ]

            if email:
                filtered_users = [
                    u for u in filtered_users
                    if email.lower() in u.get("email", "").lower()
                ]

            sorted_users = sorted(
                filtered_users,
                key=lambda u: u.get("name", "").lower()
            )

            users_list = []

            for user in sorted_users:
                user.pop("password_hash", None)
                users_list.append(user)

            return {
                "success": True,
                "users": users_list,
                "total": len(users_list)
            }

        except Exception:
            logger.exception("Erro ao buscar usuários")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao buscar usuários.",
            )

    def get_user_by_id(self, user_id: str) -> Dict[str, Any]:

        user = self.user_repo.get_user_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado."
            )

        supplier_list = self.user_repo.get_suppliers_for_user(user_id)

        user.pop("password_hash", None)
        user["supplier"] = supplier_list

        return user

    def update_existing_user(
        self,
        user_id: str,
        request_data: UserUpdateRequest,
        performed_by: Optional[str] = None
    ) -> Dict[str, Any]:

        old_user = self.get_user_by_id(user_id)

        updates = request_data.model_dump(exclude_unset=True)

        supplier_list = updates.pop("supplier", None)

        new_password = updates.pop("password", None)

        if new_password:
            updates["password_hash"] = self.hasher.hash(new_password)

        if not updates and supplier_list is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhum dado fornecido.",
            )

        if updates:
            self.user_repo.update_user(user_id, updates)

        if supplier_list is not None:
            self.user_repo.sync_user_suppliers(user_id, supplier_list)

        for key in ["name", "email", "role", "is_active"]:

            if key in updates and updates[key] != old_user.get(key):

                self.audit_service.log(
                    action=AuditAction.USER_UPDATE,
                    performed_by=performed_by,
                    entity="USER",
                    entity_id=user_id,
                    extra={
                        "field": key,
                        "old_value": old_user.get(key),
                        "new_value": updates[key]
                    }
                )

        return self.get_user_by_id(user_id)

    def delete_user_permanently(
        self,
        user_id: str,
        performed_by: Optional[str] = None
    ):

        user = self.user_repo.get_user_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado."
            )

        try:

            self.user_repo.delete_user(user_id)

            self.audit_service.log(
                action=AuditAction.USER_DELETE,
                performed_by=performed_by,
                entity="USER",
                entity_id=user_id,
                extra={"email": user.get("email")}
            )

            return True

        except Exception:
            logger.exception("Erro ao excluir usuário - user_id: %s", user_id)
            raise HTTPException(
                status_code=500,
                detail="Erro ao excluir usuário.",
            )

    def get_available_suppliers(self) -> List[str]:

        return self.user_repo.get_all_suppliers()

    def change_password(
        self,
        user_id: str,
        old_password: str,
        new_password: str,
        performed_by: str
    ):

        user = self.user_repo.get_user_by_id(user_id)

        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        if not self.hasher.verify(old_password, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Senha atual incorreta.")

        new_hash = self.hasher.hash(new_password)

        self.user_repo.update_user(user_id, {"password_hash": new_hash})

        self.audit_service.log(
            action=AuditAction.USER_PASSWORD_UPDATE,
            performed_by=performed_by,
            entity="USER",
            entity_id=user_id,
            extra={"message": "Senha alterada"}
        )

        return True