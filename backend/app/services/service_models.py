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
    role: Optional[str] = None
    supplier: Optional[List[str]] = None
    is_active: Optional[bool] = None