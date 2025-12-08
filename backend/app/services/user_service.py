import uuid
from typing import Any, Dict, List, Optional  # <--- ADICIONADO 'List' AQUI

from fastapi import HTTPException, status

from app.core.interfaces import IPasswordHasher, IUserRepository

from .service_models import UserCreateRequest, UserUpdateRequest


class UserService:
    
    def __init__(self, user_repo: IUserRepository, hasher: IPasswordHasher):
        self.user_repo = user_repo
        self.hasher = hasher

    def create_new_user(self, data: UserCreateRequest, performed_by: Optional[str] = None) -> Dict[str, Any]:
        if self.user_repo.get_user_by_email(data.email.lower()):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail já cadastrado no sistema.")
        
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
            
            # AUDITORIA
            try:
                self.user_repo.insert_audit_log(
                    performed_by=performed_by or new_user_id,
                    action="create_user",
                    entity="users",
                    entity_id=new_user_id,
                    extra={"name": created_user["name"], "role": created_user["role"]}
                )
            except Exception: 
                pass

            return created_user
        
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao salvar usuário: {str(e)}")

    def get_formatted_users(self, name: Optional[str] = None, email: Optional[str] = None) -> Dict[str, Any]:
        try:
            all_users = self.user_repo.get_all_users()        
            filtered_users = all_users
            
            if name:
                filtered_users = [u for u in filtered_users if name.lower() in u.get("name", "").lower()]
            if email:
                filtered_users = [u for u in filtered_users if email.lower() in u.get("email", "").lower()]
            
            sorted_users = sorted(filtered_users, key=lambda u: u.get("name", "").lower())
            
            users_list = []
            for user in sorted_users:
                user.pop("password_hash", None)
                users_list.append(user)
            
            return {"success": True, "users": users_list, "total": len(users_list)}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao buscar usuários: {str(e)}")

    def get_user_by_id(self, user_id: str) -> Dict[str, Any]:
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
        
        supplier_list = self.user_repo.get_suppliers_for_user(user_id)
        user.pop("password_hash", None)
        user["supplier"] = supplier_list
        return user

    def update_existing_user(self, user_id: str, request_data: UserUpdateRequest, performed_by: Optional[str] = None) -> Dict[str, Any]:
        old_user = self.get_user_by_id(user_id)
        
        updates = request_data.model_dump(exclude_unset=True)
        supplier_list = updates.pop("supplier", None) 
        
        new_password = updates.pop("password", None)
        if new_password:
            updates["password_hash"] = self.hasher.hash(new_password)

        if not updates and supplier_list is None:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nenhum dado fornecido.")

        if updates:
            try:
                self.user_repo.update_user(user_id, updates)
            except Exception as e: 
                raise e 

        if supplier_list is not None:
            try:
                self.user_repo.sync_user_suppliers(user_id, supplier_list)
            except Exception as e: 
                raise e 
        
        # AUDITORIA
        try:
            changed_fields = {}
            for key in ["name", "email", "role", "is_active"]:
                if key in updates and updates[key] != old_user.get(key):
                    changed_fields[key] = {"old": old_user.get(key), "new": updates[key]}
            
            if supplier_list is not None and set(supplier_list) != set(old_user.get("supplier", [])):
                changed_fields["supplier"] = {"old": old_user.get("supplier"), "new": supplier_list}

            if changed_fields:
                self.user_repo.insert_audit_log(
                    performed_by=performed_by or "system",
                    action="update_user",
                    entity="users",
                    entity_id=user_id,
                    extra=changed_fields
                )
        except Exception: 
            pass
        
        return self.get_user_by_id(user_id)
  
    def delete_user_permanently(self, user_id: str, performed_by: Optional[str] = None):
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
             raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        try:
            self.user_repo.delete_user(user_id) 
            
            # AUDITORIA
            try:
                self.user_repo.insert_audit_log(
                    performed_by=performed_by or "system",
                    action="delete_user",
                    entity="users",
                    entity_id=user_id,
                    extra={"deleted_user": user.get("email")}
                )
            except Exception: 
                pass

            return True
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao excluir: {str(e)}")

    def get_available_suppliers(self) -> List[str]:
        return self.user_repo.get_all_suppliers()
    
    def change_password(self, user_id: str, old_password: str, new_password: str, performed_by: str):
        # Buscar usuário
        user = self.user_repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        # Validar senha antiga
        if not self.hasher.verify(old_password, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Senha atual incorreta.")

        # Gerar hash da nova senha
        new_hash = self.hasher.hash(new_password)

        # Atualizar no banco
        self.user_repo.update_user(user_id, {"password_hash": new_hash})

        # Auditoria
        try:
            self.user_repo.insert_audit_log(
                performed_by=performed_by,
                action="update_password",
                entity="users",
                entity_id=user_id,
                extra={"message": "Senha alterada pelo próprio usuário"}
            )
        except Exception:
            pass

        return True
