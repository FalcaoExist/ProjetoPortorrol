from datetime import date, datetime
from enum import Enum
from typing import List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, EmailStr


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


# --- Status e Configurações ---
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


# --- Schemas de Fornecedor ---
class FornecedorCreate(BaseModel):
    name: str
    budget: float
    leadtime: int
    start: date
    end: date
    external_id: Optional[str] = None

class FornecedorUpdate(BaseModel):
    name: str
    budget: float
    leadtime: int
    start: date
    end: date

class FornecedorResponse(BaseModel):
    supplier_id: UUID
    name: str
    budget: Optional[float] = None
    leadtime: Optional[int] = None
    start: Optional[date] = None
    end: Optional[date] = None
    external_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    update_at: Optional[datetime] = None


# --- Schemas de Pedido e Estoque ---
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

class UpdateItemDate(BaseModel):
    delivery_date: str | None

class BatchOrderRequest(BaseModel):
    items: List[OrderItemRequest]

class BatchOrderResponse(BaseModel):
    success: bool
    message: str
    orders_created: int