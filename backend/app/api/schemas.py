from typing import List, Optional
from uuid import UUID
from datetime import date, datetime
from enum import Enum
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
    supplier_id: UUID
    name: str
    lead_time_days: Optional[int]
    is_active: bool

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