from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr     
    password: str
    role: str
    supplier: List[str]

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None  
    supplier: Optional[List[str]] = None 