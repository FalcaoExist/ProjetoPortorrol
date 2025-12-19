from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    supplier: List[str]
    is_active: bool

class UserListItem(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    is_active: bool
    # Campo opcional para listagens que incluem fornecedores
    supplier: Optional[List[str]] = []

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    # Permite que 'user' seja nulo em caso de erro no login
    user: Optional[dict] = None
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