from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from app.core.repositories import JsonUserRepository
from app.core.hashers import BcryptHasher
from app.core.services import AuthService
import uuid
from typing import List, Optional


app = FastAPI(title="IBy Login API (Em SOLID)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    success: bool
    user: dict
    message: str

# Criar novo usuario com campo obrigatório  
class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr     
    password: str
    role: str
    supplier: List[str]

    
    @field_validator('name', 'password', 'role')
    def validate_not_empty(cls, v, field):
        if not v or not v.strip():
            raise ValueError(f'{field.name} não pode estar vazio')
        return v.strip()

    @field_validator('supplier')
    def validate_supplier(cls, v):
        if not v or len(v) == 0:
            raise ValueError('Deve haver ao menos um fornecedor associado')
        return [f.strip() for f in v if f.strip()]  
    
class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    supplier: List[str]
    active: bool
    
class UserCreateResponse(BaseModel):
    success: bool
    user: UserResponse
    message: str        
    
    #Listagem de usuario
class UserListItem(BaseModel):
    id: str
    name: str
    email: str
    role: str
    active: bool

    
class UserListResponse(BaseModel):
    success: bool
    users: List[UserListItem]
    total: int
    
# injeção de dependências
user_repo = JsonUserRepository()
hasher = BcryptHasher()
auth_service = AuthService(user_repo, hasher)

#endpoint de autenticação
@app.post("/login", response_model=LoginResponse)
def login(data: LoginRequest):
    user = auth_service.check_credentials(data.email, data.password)

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
        "message": "Login realizado com sucesso (via JSON)",
    }


@app.get("/")
def root():
    return {"message": "Backend rodando com banco de dados JSON!", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/users", response_model=UserCreateResponse, status_code=201)
def create_user(data: UserCreateRequest):
    # Validar e-mail duplicado
    try:
        existing_users = user_repo.get_all_users()
        email_lower = data.email.lower()
        
        for user in existing_users:
            if user.get("email", "").lower() == email_lower:
                raise HTTPException(
                    status_code=400,
                    detail="E-mail já cadastrado no sistema."
                )
    except AttributeError:
        pass
    
    # Criar usuário com status ativo por padrão
    user_id = str(uuid.uuid4())
    password_hash = hasher.hash(data.password)    
    new_user = {
        "id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "password": password_hash,
        "role": data.role,
        "supplier": data.supplier,
        "active": True  
    }
    
    # Salvar no repositório
    try:
        user_repo.save_user(new_user)  # ou user_repo.save_user(new_user)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar usuário: {str(e)}"
    )
    
    return {
        "success": True,
        "user": {
            "id": user_id,
            "name": data.name,
            "email": data.email.lower(),
            "role": data.role,
            "supplier": data.supplier,
            "active": True
        },
        "message": "Usuário cadastrado com sucesso!"
    }   
@app.get("/users", response_model=UserListResponse)
def list_users(name: Optional[str] = None, email: Optional[str] = None):
    
    try:
        all_users = user_repo.get_all_users()        
        filtered_users = all_users
        
        # Filtro por nome 
        if name:
            name_lower = name.lower()
            filtered_users = [
                u for u in filtered_users 
                if name_lower in u.get("name", "").lower()
            ]
        
        # Filtro por e-mail
        if email:
            email_lower = email.lower()
            filtered_users = [
                u for u in filtered_users 
                if email_lower in u.get("email", "").lower()
            ]
        
        # Ordenar alfabeticamente por nome
        sorted_users = sorted(
            filtered_users, 
            key=lambda u: u.get("name", "").lower()
        )
        
        # Formatar colunas 
        users_list = [
            {
                "id": u.get("id"),
                "name": u.get("name"),
                "email": u.get("email"),
                "role": u.get("role"),
                "active": u.get("active", True)
                }
            for u in sorted_users
        ]
        
        return {
            "success": True,
            "users": users_list,
            "total": len(users_list) 
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar usuários: {str(e)}"
        )
@app.get("/users/all", response_model=UserListResponse)
def get_all_users():
    """
    Endpoint para listar TODOS os usuários sem filtros
    
    Retorna todos os usuários cadastrados (ativos e inativos)
    ordenados alfabeticamente por nome.
    """
    
    try:
        # Buscar todos os usuários do banco de dados
        all_users = user_repo.get_all_users()
        
        # Ordenar alfabeticamente por nome
        sorted_users = sorted(
            all_users, 
            key=lambda u: u.get("name", "").lower()
        )
        
        # Formatar resposta
        users_list = [
            {
                "id": u.get("id"),
                "name": u.get("name"),
                "email": u.get("email"),
                "role": u.get("role"),
                "active": u.get("active", True)
            }
            for u in sorted_users
        ]
        
        return {
            "success": True,
            "users": users_list,
            "total": len(users_list)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar usuários: {str(e)}"
        )