from typing import List, Optional

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    supplier: Optional[List[str]] = [] # <--- CORRIGIDO (Opcional)
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

from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class StatusProduto(str, Enum):
    RUPTURA = "RUPTURA"   # < 50%
    OK = "OK"             # 100% exato
    EXCESSO = "EXCESSO"   # > 100%

class ConfigUpdate(BaseModel):
    valor: str

class SkuAnaliseResponse(BaseModel):
    sku_id: int
    codigo: str
    nome_produto: str
    marca: str
    classificacao: str
    atendimento: float
    status: StatusProduto # Calculado dinamicamente
    sugestao_compra: int
    estoque_soma: int
    demanda_soma: float
    # Adicione campos de filiais se precisar detalhar no card

class FilialResponse(BaseModel):
    id: str
    nome: str

class DashboardSummary(BaseModel):
    total_skus: int
    total_ruptura: int
    total_excesso: int
    orcamento_atual: float
    lead_time_atual: int
