from datetime import date, datetime
from enum import Enum
from typing import List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# --- Schemas de Usuário e Login ---
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
    current_password: str
    new_password: str

# --- CORREÇÃO AQUI: Adicionado SUBDIMENSIONADO ---
class StatusProduto(str, Enum):
    RUPTURA = "RUPTURA"
    SUBDIMENSIONADO = "SUBDIMENSIONADO" 
    OK = "OK"
    EXCESSO = "EXCESSO"

class ConfigUpdate(BaseModel):
    valor: str

class SkuAnaliseResponse(BaseModel):
    sku_id: int
    codigo: str
    nome_produto: str
    marca: str
    classificacao: str
    atendimento: float
    status: StatusProduto
    sugestao_compra: int
    estoque_soma: int
    demanda_soma: float
    filial_nome: Optional[str] = "Geral"

class FilialResponse(BaseModel):
    id: str
    nome: str

# --- Schemas de Fornecedor e Pedido ---
class FornecedorCreate(BaseModel):
    name: str
    lead_time_days: Optional[int] = 30
    external_id: Optional[str] = None

class FornecedorResponse(BaseModel):
    id: str = Field(..., alias="supplier_id") 
    name: str
    is_active: bool
    lead_time_days: Optional[int] = 30
    
    class Config:
        populate_by_name = True
        from_attributes = True

class PedidoCreate(BaseModel):
    sku_codigo: str          
    fornecedor_nome: str     
    quantidade: int
    valor_unitario: float
    previsao_entrega: Optional[date] = None

class PedidoResponse(BaseModel):
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
    
class OrderUpdate(BaseModel):
    data_entrega: Optional[str] = None
    status: Optional[str] = None

class BatchOrderItem(BaseModel):
    id: Optional[str] = None
    sku_id: int
    quantity: int
    unit_cost: float
    supplier_name: Optional[str] = None
    expected_delivery_date: Optional[Union[date, datetime, str]] = None

class OrderItemRequest(BaseModel):
    sku_id: int
    quantity: int
    unit_cost: float
    supplier_name: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    
class UpdateItemDate(BaseModel):
    delivery_date: str | None
      
class BatchOrderResponse(BaseModel):
    success: bool
    message: str
    orders_created: int

class BatchOrderRequest(BaseModel):
    items: List[OrderItemRequest]    
    
class FornecedorCreate(BaseModel):
    name: str
    lead_time_days: Optional[int] = 30
    external_id: Optional[str] = None

    
class FornecedorResponse(BaseModel):
    supplier_id: UUID
    name: str
    lead_time_days: Optional[int]
    is_active: bool
    data_entrega: Optional[date] = None
