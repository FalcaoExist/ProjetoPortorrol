from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    supplier: List[str]
    is_active: bool

# --- AQUI ESTAVA FALTANDO O CAMPO ---
class UserListItem(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    is_active: bool
    # Adicione esta linha para permitir que a lista de fornecedores apareça
    supplier: Optional[List[str]] = []

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    user: dict
    message: str

class UserCreateResponse(BaseModel):
    success: bool
    user: UserResponse
    message: str
    
class UserListResponse(BaseModel):
    success: bool
    users: List[UserListItem]
    total: int

class UserGetResponse(BaseModel):
    success: bool
    user: UserResponse

class UserUpdateResponse(BaseModel):
    success: bool
    user: UserResponse
    message: str