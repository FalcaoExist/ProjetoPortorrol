from fastapi import HTTPException, status
from app.core.interfaces import IPasswordHasher, IUserRepository
from .service_models import UserCreateRequest, UserUpdateRequest
import uuid
from typing import List, Dict, Any, Optional

class UserService:
    
    def __init__(self, user_repo: IUserRepository, hasher: IPasswordHasher):
        self.user_repo = user_repo
        self.hasher = hasher

    def create_new_user(self, data: UserCreateRequest) -> Dict[str, Any]:
        if self.user_repo.get_user_by_email(data.email.lower()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="E-mail já cadastrado no sistema."
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
            
            # ADICIONA A LISTA DE SUPPLIERS DE VOLTA (para bater com o schema)
            created_user["supplier"] = data.supplier
            
            return created_user
        
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao salvar usuário ou seus fornecedores: {str(e)}"
            )

    def get_formatted_users(self, name: Optional[str] = None, email: Optional[str] = None) -> Dict[str, Any]:
        # Este método está OK porque o schema 'UserListItem'
        # (usado para listas) não requer o campo 'supplier'.
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
            
            return {
                "success": True,
                "users": users_list,
                "total": len(users_list) 
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao buscar usuários: {str(e)}"
            )

    def get_user_by_id(self, user_id: str) -> Dict[str, Any]:
        # ATUALIZADO: Este método agora busca os suppliers
        user = self.user_repo.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado."
            )
        
        # Busca a lista de suppliers na tabela de junção
        supplier_list = self.user_repo.get_suppliers_for_user(user_id)
        
        user.pop("password_hash", None)
        
        # Adiciona a lista ao objeto
        user["supplier"] = supplier_list
        
        return user

    def update_existing_user(self, user_id: str, request_data: UserUpdateRequest) -> Dict[str, Any]:
        # ATUALIZADO: Este método agora retorna o utilizador completo
        
        self.get_user_by_id(user_id) # Validação inicial
        
        updates_for_user_table = request_data.model_dump(exclude_unset=True)
        supplier_ids_list = updates_for_user_table.pop("supplier", None) 

        if not updates_for_user_table and supplier_ids_list is None:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhum dado fornecido para atualização."
            )

        if updates_for_user_table:
            try:
                self.user_repo.update_user(user_id, updates_for_user_table)
            except Exception as e:
                raise e 

        if supplier_ids_list is not None:
            try:
                self.user_repo.sync_user_suppliers(user_id, supplier_ids_list)
            except Exception as e:
                raise e 
        
        # Retorna o estado final e completo do utilizador,
        # que agora inclui a lista de suppliers.
        return self.get_user_by_id(user_id)