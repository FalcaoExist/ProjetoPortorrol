from fastapi import HTTPException, status
from .interfaces import IPasswordHasher, IUserRepository
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr # Importa modelos para tipagem

# Define o "contrato" de dados que o UserService espera receber da API
class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr     
    password: str
    role: str
    supplier: List[str]

# ================================================================
# 1. AuthService (Lógica de Autenticação)
# ================================================================
class AuthService:
    """
    Serviço responsável pela lógica de negócio de AUTENTICAÇÃO.
    """

    def __init__(self, user_repo: IUserRepository, hasher: IPasswordHasher):
        """
        Inicializador que recebe as abstrações (Interfaces)
        via Injeção de Dependência (DIP).
        """
        self.user_repo = user_repo
        self.hasher = hasher

    def check_credentials(self, email: str, password: str) -> Dict[str, Any]:
        """
        Verifica se um e-mail e senha são válidos e se o usuário está ativo.
        """
        # 1. Busca o usuário no repositório
        user = self.user_repo.get_user_by_email(email.lower())

        # 2. Valida se o usuário existe
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")

        # 3. Valida se o usuário está ativo 
        if not user.get("is_active", False):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário desativado.")

        # 4. Valida a senha 
        if not self.hasher.verify(password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")
        
        # 5. Remove o hash da senha antes de retornar 
        user.pop("password_hash", None)
        return user

# ================================================================
# 2. UserService (Lógica de Gerenciamento de Usuário)
# ================================================================
class UserService:
    """
    Serviço responsável pela lógica de negócio de GERENCIAMENTO (CRUD) de usuários.
    """

    def __init__(self, user_repo: IUserRepository, hasher: IPasswordHasher):
        """Inicializador que recebe as abstrações (Interfaces)."""
        self.user_repo = user_repo
        self.hasher = hasher

    def create_new_user(self, data: UserCreateRequest) -> Dict[str, Any]:
        """
        Processa e cria um novo usuário.
        Responsabilidades: Validar duplicidade, hashear senha,
        montar o objeto de banco e chamar o repositório.
        """
        # 1. Validação de duplicidade
        if self.user_repo.get_user_by_email(data.email.lower()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="E-mail já cadastrado no sistema."
            )
        
        # 2. Lógica de criação
        # Prepara o dicionário com os nomes exatos das colunas do DB
        new_user_data_db = {
            "user_id": str(uuid.uuid4()),
            "name": data.name,
            "email": data.email.lower(),
            "password_hash": self.hasher.hash(data.password), # Hasheia a senha
            "role": data.role,
            "supplier": data.supplier,
            "is_active": True  # Novo usuário sempre começa ativo
        }
        
        # 3. Persistência
        try:
            created_user = self.user_repo.create_user(new_user_data_db)
            
            # 4. Remove o hash da senha antes de retornar 
            created_user.pop("password_hash", None)
            return created_user
        
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Erro ao salvar usuário: {str(e)}"
            )

    def get_formatted_users(self, name: Optional[str] = None, email: Optional[str] = None) -> Dict[str, Any]:
        """
        Busca, filtra e formata a lista de usuários para a API.
        """
        try:
            all_users = self.user_repo.get_all_users()        
            filtered_users = all_users
            
            # Filtros 
            if name:
                filtered_users = [u for u in filtered_users if name.lower() in u.get("name", "").lower()]
            if email:
                filtered_users = [u for u in filtered_users if email.lower() in u.get("email", "").lower()]
            
            # Ordenação
            sorted_users = sorted(filtered_users, key=lambda u: u.get("name", "").lower())
            
            # Formatação e Segurança 
            users_list = []
            for user in sorted_users:
                user.pop("password_hash", None) # Remove o hash
                users_list.append(user)
            
            # Retorna o payload esperado pela API
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