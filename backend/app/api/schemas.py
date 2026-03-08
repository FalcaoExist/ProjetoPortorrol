from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, EmailStr

# SCHEMAS DE LOGIN
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.test",
                "password": "StrongPass-123",
            }
        }
    }

class LoginResponse(BaseModel):
    success: bool
    user: Optional[dict] = None
    message: str

# SCHEMAS DE USUÁRIO
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

    model_config = {
        "json_schema_extra": {
            "example": {
                "current_password": "OldPass-123",
                "new_password": "NewPass-123",
            }
        }
    }

# SCHEMAS DE PRODUTOS
class StatusProduto(str, Enum):
    RUPTURA = "RUPTURA"
    SUBDIMENSIONADO = "SUBDIMENSIONADO" 
    OK = "OK"
    EXCESSO = "EXCESSO"

class ConfigUpdate(BaseModel):
    valor: str

    model_config = {"json_schema_extra": {"example": {"valor": "45"}}}

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

# SCHEMAS DE LEADTIME
class SupplierLeadtimeCreate(BaseModel):
    branch_id: UUID
    leadtime: int

class SupplierLeadtimeResponse(SupplierLeadtimeCreate):
    leadtime_id: UUID

# SCHEMAS DE FORNECEDORES
class FornecedorCreate(BaseModel):
    name: str
    is_active: bool
    external_id: Optional[str] = None
    budget: Optional[float] = None
    start: Optional[date] = None
    end: Optional[date] = None
    external_id: Optional[str] = None
    leadtimes: Optional[List[SupplierLeadtimeCreate]] = []

class FornecedorUpdate(BaseModel):
    name: str
    budget: float
    leadtimes: Optional[List[SupplierLeadtimeCreate]] = []
    start: date
    end: date

class FornecedorResponse(BaseModel):
    supplier_id: UUID
    name: str
    is_active: bool
    external_id: Optional[str] = None
    budget: Optional[float] = None
    start: Optional[date] = None
    end: Optional[date] = None
    created_at: datetime
    update_at: Optional[datetime] = None
    leadtimes: List[SupplierLeadtimeResponse] = []

# SCHEMAS DE PEDIDOS
class PedidoCreate(BaseModel):
    sku_codigo: str          
    fornecedor_nome: str     
    quantidade: int
    valor_unitario: float
    previsao_entrega: Optional[date] = None
    branch_name: Optional[str] = "Geral"

    model_config = {
        "json_schema_extra": {
            "example": {
                "sku_codigo": "SKU-EXAMPLE-001",
                "fornecedor_nome": "SUPPLIER_DEMO_A",
                "quantidade": 100,
                "valor_unitario": 10.5,
                "previsao_entrega": "2026-04-01",
                "branch_name": "BRANCH_DEMO_A",
            }
        }
    }

class PedidoResponse(BaseModel):
    order_id: UUID
    status: str
    created_at: datetime
    supplier_name: str
    item_name: str
    quantity: int
    total_value: float
    data_entrega: Optional[date] = None

class OrderItemRequest(BaseModel):
    sku_id: int
    quantity: int
    unit_cost: float
    expected_delivery_date: Optional[str] = None 
    supplier_name: Optional[str] = None
    branch_name: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "sku_id": 1001,
                "quantity": 50,
                "unit_cost": 20.0,
                "expected_delivery_date": "2026-04-01",
                "supplier_name": "SUPPLIER_DEMO_A",
                "branch_name": "BRANCH_DEMO_A",
            }
        }
    }

class OrderUpdate(BaseModel):
    data_entrega: Optional[str] = None
    status: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "data_entrega": "2026-04-05",
                "status": "Pendente",
            }
        }
    }
    
# SCHEMAS DE ESTOQUE
class StockItemResponse(BaseModel):
    id: Union[int, str] # sku_id
    sku_id: Optional[int] = None
    codigo: str
    item: str # nome do produto
    categoria: Optional[str] = "Geral"
    unidades: int
    fornecedor: Optional[str] = "N/A"
    filial: Optional[str] = None
    dias_cobertura: Optional[float] = 0
    valor: Optional[float] = 0.0
    pedidos_pendentes: Optional[int] = 0
    unidades_pendentes: Optional[int] = 0
    estoque_projetado: Optional[int] = 0
    dias_cobertura_projetado: Optional[float] = None
    quantidade_sugerida_compra_projetada: Optional[int] = 0
    rop: Optional[int] = 0
    qtd_sugerida: Optional[int] = 0
    leadtime: Optional[int] = 0
    porto_alegre: Optional[int] = 0
    joinville: Optional[int] = 0
    sao_paulo: Optional[int] = 0
    demanda_mensal: Optional[float] = 0.0

class BatchOrderItem(BaseModel):
    id: Optional[str] = None
    sku_id: int
    quantity: int
    unit_cost: float
    supplier_name: Optional[str] = None
    expected_delivery_date: Optional[Union[date, datetime, str]] = None
    branch_name: Optional[str] = None
    
    class Config:
        extra = "allow"

class UpdateItemDate(BaseModel):
    delivery_date: str | None

class BatchOrderRequest(BaseModel):
    items: List[OrderItemRequest]

    model_config = {
        "json_schema_extra": {
            "example": {
                "items": [
                    {
                        "sku_id": 1001,
                        "quantity": 30,
                        "unit_cost": 12.25,
                        "supplier_name": "SUPPLIER_DEMO_A",
                        "branch_name": "BRANCH_DEMO_A",
                    }
                ]
            }
        }
    }

class BatchOrderResponse(BaseModel):
    success: bool
    message: str
    orders_created: int

class StockImportPayload(BaseModel):
    filename: str
    data: List[Dict[str, Any]]


class ImportStockResponse(BaseModel):
    success: bool
    message: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Importação de stock iniciada com sucesso.",
            }
        }
    }


class ImportOrdersResponse(BaseModel):
    success: bool
    message: str
    count: Optional[int] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Sucesso! 35 pedidos do fornecedor de exemplo foram importados.",
                "count": 35,
            }
        }
    }


class SimpleMessageResponse(BaseModel):
    success: bool
    message: str


class AuditListResponse(BaseModel):
    success: bool
    logs: List[Dict[str, Any]]