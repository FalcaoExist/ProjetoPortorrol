from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    supplier: Optional[List[str]] = []
    is_active: bool

class UserListItem(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    is_active: bool
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

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    
class PedidoCreate(BaseModel):
    sku_codigo: str          
    fornecedor_nome: str     
    quantidade: int
    valor_unitario: float
    previsao_entrega: Optional[date] = None

class PedidoResponse(BaseModel):
    id: UUID
    order_id: UUID
    status: str
    created_at: datetime
    supplier_name: str
    item_name: str
    quantity: int
    total_value: float
    data_entrega: Optional[date] = None
    
class StockItemResponse(BaseModel):
    id: int # sku_id
    codigo: str
    item: str # nome do produto
    categoria: Optional[str] = "Geral"
    unidades: int
    fornecedor: Optional[str] = "N/A"
    filial: Optional[str] = "Matriz"
    dias_cobertura: Optional[int] = 0
    valor: Optional[float] = 0.0

class OrderItemRequest(BaseModel):
    sku_id: int
    quantity: int
    unit_cost: float
    expected_delivery_date: Optional[str] = None 
    supplier_name: Optional[str] = None

class BatchOrderRequest(BaseModel):
    items: List[OrderItemRequest]

class BatchOrderResponse(BaseModel):
    success: bool
    message: str
    orders_created: int
    
class FornecedorCreate(BaseModel):
    name: str
    lead_time_days: Optional[int] = 30
    external_id: Optional[str] = None

    
class FornecedorResponse(BaseModel):
    supplier_id: UUID
    name: str
    lead_time_days: Optional[int]
    is_active: bool
