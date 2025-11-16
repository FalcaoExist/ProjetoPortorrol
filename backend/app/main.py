from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional

from app.core.dependencies import get_auth_service, get_user_service

# Importa os SERVIÇOS (apenas para type hinting) e o modelo de request
from app.core.services import AuthService, UserService, UserCreateRequest

app = FastAPI(title="IBy Login API (SOLID e Uniformizado)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    """Define o que o cliente deve ENVIAR para /login."""
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    """Define o que a API RETORNA em /login."""
    success: bool
    user: dict # O serviço retorna um dict já formatado
    message: str
 
# O 'UserCreateRequest' é importado do 'services.py'
# Define o que o cliente deve ENVIAR para /users.
    
class UserResponse(BaseModel):
    """Define o formato de um usuário completo RETORNADO pela API."""
    user_id: str # UNIFORMIZADO
    name: str
    email: str
    role: str
    supplier: List[str]
    is_active: bool # UNIFORMIZADO

class UserCreateResponse(BaseModel):
    """Define o que a API RETORNA em /users."""
    success: bool
    user: UserResponse # Usa o modelo de usuário acima
    message: str        
    
class UserListItem(BaseModel):
    """Define o formato de um item na lista de usuários."""
    user_id: str # UNIFORMIZADO
    name: str
    email: str
    role: str
    is_active: bool # UNIFORMIZADO

class UserListResponse(BaseModel):
    """Define o que a API RETORNA em /users e /users/all."""
    success: bool
    users: List[UserListItem] # Uma lista do modelo acima
    total: int
    
# --- Endpoints da API  ---

@app.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest,
    # Pede ao FastAPI: "Execute 'get_auth_service' e me dê o resultado."
    auth_service: AuthService = Depends(get_auth_service)
):
    """Endpoint para autenticar um usuário."""
    # 1. Delega a lógica de negócio para o serviço
    user_dict = auth_service.check_credentials(data.email, data.password)

    # 2. Formata a resposta (o 'user_dict' já vem seguro, sem hash)
    return {
        "success": True,
        "user": user_dict, # O serviço já formatou isso
        "message": "Login realizado com sucesso (via Supabase)",
    }

@app.post("/users", response_model=UserCreateResponse, status_code=201)
def create_user(
    data: UserCreateRequest, # 'data' é validado pelo Pydantic
    # Pede ao FastAPI: "Execute 'get_user_service' e me dê o resultado."
    user_service: UserService = Depends(get_user_service)
):
    """Endpoint para criar um novo usuário."""
    # 1. Delega a lógica (validar, hashear, salvar) para o serviço
    created_user = user_service.create_new_user(data)
    
    # 2. Formata a resposta (o 'created_user' já vem seguro)
    return {
        "success": True,
        "user": created_user, # O Pydantic valida se 'created_user' bate com 'UserResponse'
        "message": "Usuário cadastrado com sucesso!"
    }   

@app.get("/users", response_model=UserListResponse)
def list_users(
    name: Optional[str] = None, 
    email: Optional[str] = None,
    user_service: UserService = Depends(get_user_service)
):
    """Endpoint para listar e filtrar usuários."""
    # Delega toda a lógica (buscar, filtrar, formatar, remover hash)
    return user_service.get_formatted_users(name, email)

@app.get("/users/all", response_model=UserListResponse)
def get_all_users(
    user_service: UserService = Depends(get_user_service)
):
    """Endpoint para listar TODOS os usuários (reutiliza a lógica)."""
    # Reutiliza o mesmo método de serviço (Princípio DRY)
    return user_service.get_formatted_users()

# --- Endpoints de Status ---

@app.get("/")
def root():
    """Endpoint raiz para verificação de status."""
    return {"message": "Backend rodando com Supabase! (SOLID)", "status": "ok"}

@app.get("/health")
def health():
    """Endpoint de 'health check'."""
    return {"status": "healthy"}