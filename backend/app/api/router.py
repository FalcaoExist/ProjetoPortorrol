from typing import List, Optional, Annotated

from fastapi import (
    APIRouter, BackgroundTasks, Depends, File, Header, 
    HTTPException, Query, Request, Response, UploadFile, Path
)
from dotenv import load_dotenv
from app.core.security import create_access_token

from app.api.schemas import (
    ConfigUpdate, FilialResponse, SkuAnaliseResponse, StatusProduto,
)
from app.core.dependencies import (
    get_audit_service, get_auth_service, get_current_user,
    get_user_repository, get_user_service,
    get_supplier_service, get_order_service, get_stock_service,
)
from app.core.interfaces import IUserRepository

# Serviços e Repositórios
from app.repositories.import_repository import process_import_file
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService
from app.services.import_orders_service import ImportOrdersService
from app.services.dashboard_service import DashboardService
from app.services.user_service import UserService
from app.services.service_models import UserCreateRequest, UserUpdateRequest
from app.services.supplier_service import SupplierService
from app.services.order_service import OrderService
from app.services.stock_service import StockService
from app.repositories.orders_repository import OrdersRepository
from app.core.dependencies import get_current_user, get_orders_repo

# Schemas Locais
from .schemas import (
    BatchOrderRequest, BatchOrderResponse, ChangePasswordRequest,
    FornecedorCreate, FornecedorResponse, LoginRequest,
    LoginResponse, OrderUpdate, PedidoCreate, PedidoResponse, StockItemResponse,
    UserCreateResponse, UserGetResponse, UserListResponse, UserUpdateResponse,
)

# --- INICIALIZAÇÃO ---
load_dotenv()
router = APIRouter()

# --- HELPERS ---

def get_dashboard_service():
    return DashboardService()

# AUTENTICAÇÃO 

@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest, 
    response: Response, 
    request: Request, 
    auth_service: AuthService = Depends(get_auth_service)
):
    # Pega o IP do cliente (considerando proxy ou direto)
    ip = request.headers.get("x-forwarded-for", request.client.host).split(",")[0].strip()
    
    result = auth_service.check_credentials(data.email, data.password, ip_address=ip)
    
    if not result:
        return {"success": False, "message": "Credenciais inválidas", "user": None}

    access_token = create_access_token(data={"sub": result["user_id"]})
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=18000,
        samesite="lax",
        secure=False 
    )

    return {"success": True, "user": result, "message": "Login realizado com sucesso"}

@router.get("/me", response_model=UserGetResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return { "success": True, "user": current_user }

@router.put("/me/password")
def change_own_password(
    data: ChangePasswordRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    user_service.change_password(
        user_id=current_user["user_id"],
        current_password=data.current_password,
        new_password=data.new_password,
        performed_by=current_user["user_id"]
    )
    return {"success": True, "message": "Senha alterada com sucesso!"}


# GESTÃO DE USUÁRIOS

@router.post("/users", response_model=UserCreateResponse, status_code=201)
def create_user(
    data: UserCreateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Permissão negada.")
    created_user = user_service.create_new_user(data, performed_by=current_user.get("user_id"))
    return {"success": True, "user": created_user, "message": "Usuário cadastrado com sucesso!"}

@router.get("/users", response_model=UserListResponse)
def list_users(name: Optional[str] = None, email: Optional[str] = None, user_service: UserService = Depends(get_user_service)):
    return user_service.get_formatted_users(name, email)

@router.get("/users/all", response_model=UserListResponse)
def get_all_users(user_service: UserService = Depends(get_user_service)):
    return user_service.get_formatted_users()

@router.get("/users/{user_id}", response_model=UserGetResponse)
def get_user_by_id(user_id: str, user_service: UserService = Depends(get_user_service)):
    user = user_service.get_user_by_id(user_id)
    return {"success": True, "user": user}

@router.put("/users/{user_id}", response_model=UserUpdateResponse)
def update_user(
    user_id: str, data: UserUpdateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    updated_user = user_service.update_existing_user(user_id, data, performed_by=current_user.get("user_id"))
    return {"success": True, "user": updated_user, "message": "Usuário atualizado com sucesso!"}

@router.delete("/users/{user_id}", status_code=204)
def delete_user_endpoint(user_id: str, service: UserService = Depends(get_user_service), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Permissão negada.")
    service.delete_user_permanently(user_id, performed_by=current_user.get("user_id"))
    return None


# FORNECEDORES

@router.get("/suppliers")
def get_suppliers_list(current_user: dict = Depends(get_current_user), supplier_service: SupplierService = Depends(get_supplier_service)):
    try:
        fornecedores = supplier_service.get_active_suppliers()
        # Mapeia a lista de dicionários para devolver APENAS uma lista de strings com os nomes
        return [f.get("name") for f in fornecedores if f.get("name")]
    except Exception as e:
        print(f"Erro na rota de fornecedores: {e}")
        return []

@router.post("/suppliers", response_model=FornecedorResponse)
def create_supplier(data: FornecedorCreate, current_user: dict = Depends(get_current_user), supplier_service: SupplierService = Depends(get_supplier_service)):
    try:
        created = supplier_service.create_supplier(data.name, lead_time_days=data.lead_time_days, external_id=data.external_id)
        return created
    except Exception as e:
        if "duplicate key" in str(e):
            raise HTTPException(status_code=400, detail="Fornecedor ou ID externo já existe.")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/suppliers/{id}")
def delete_supplier(id: str, current_user: dict = Depends(get_current_user), supplier_service: SupplierService = Depends(get_supplier_service)):
    try:
        supplier_service.deactivate_supplier(id)
        return {"message": "Fornecedor inativado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# PEDIDOS E ESTOQUE

@router.get("/orders")
def get_orders(orders_repo: OrdersRepository = Depends(get_orders_repo)):
    return orders_repo.get_all_orders()

@router.patch("/orders/{order_id}")
def update_order(order_id: str, order: OrderUpdate, orders_repo: OrdersRepository = Depends(get_orders_repo)):
    return orders_repo.update_order(order_id, order.model_dump(exclude_unset=True))

@router.put("/orders/{order_id}")
def update_order_put(order_id: str, order: OrderUpdate, orders_repo: OrdersRepository = Depends(get_orders_repo)):
    return update_order(order_id, order, orders_repo)


@router.post("/orders")
def create_order(pedido: PedidoCreate, current_user: dict = Depends(get_current_user), orders_repo: OrdersRepository = Depends(get_orders_repo)):
    # Enviamos o dicionário current_user completo
    return orders_repo.create_single_order(current_user, pedido)

@router.post("/orders/batch")
def create_batch_order(payload: BatchOrderRequest, current_user: dict = Depends(get_current_user), orders_repo: OrdersRepository = Depends(get_orders_repo)):
    # Enviamos o dicionário current_user completo
    return orders_repo.create_batch_order(current_user, payload.items)
            
@router.get("/stock")
def get_stock_endpoint(
    filial: Optional[str] = None,
    fornecedor: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    stock_service: StockService = Depends(get_stock_service)
):
    try:
        # O router apenas chama a função do serviço e devolve o resultado
        return stock_service.get_stock(
            filial=filial, 
            fornecedor=fornecedor, 
            status=status, 
            current_user=current_user
        )
    except Exception as e:
        # Captura erros do serviço e converte num erro HTTP para o Frontend
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estoque: {str(e)}")
    

    # DASHBOARD E IMPORTAÇÃO
    
@router.post("/stock/import")
async def import_stock(background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Envie um arquivo CSV")
    contents = await file.read()
    user_id = current_user.get("user_id")
    background_tasks.add_task(process_import_file, contents, user_id)
    return {"success": True, "message": "Processamento iniciado em segundo plano."}    
    

@router.get("/dashboard/search")
def search_skus(
    term: str = Query(..., min_length=1), 
    service: DashboardService = Depends(get_dashboard_service)
):
    try:
        return service.search_products(term)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na busca: {str(e)}")

@router.get("/dashboard/skus", response_model=List[SkuAnaliseResponse])
def listar_skus_dashboard(status: Optional[StatusProduto] = Query(None), filial: Optional[str] = Query(None), fornecedor: Optional[str] = Query(None), service: DashboardService = Depends(get_dashboard_service)):
    return service.get_filtered_skus(status_filter=status.value if status else None, branch=filial, supplier=fornecedor)

@router.get("/dashboard/filiais", response_model=List[FilialResponse])
def listar_filiais_dashboard(service: DashboardService = Depends(get_dashboard_service)):
    return service.get_branches()

@router.post("/dashboard/config/lead-time")
def atualizar_lead_time(config: ConfigUpdate, service: DashboardService = Depends(get_dashboard_service)):
    return service.update_lead_time(config.valor)

@router.get("/dashboard/history")
def get_product_history(sku_id: Optional[int] = None, service: DashboardService = Depends(get_dashboard_service)):
    return service.get_sku_history(sku_id)

@router.post("/imports/pedidos/{supplier}")
async def import_orders_file(supplier: Annotated[str, Path(...)], file: Annotated[UploadFile, File(...)]):
    service = ImportOrdersService()
    imported = await service.import_file(supplier, file)
    return {"success": True, "imported": imported}

# AUDITORIA E LOGS

@router.get("/login-attempts")
def list_login_attempts(limit: int = 200, offset: int = 0, repo: IUserRepository = Depends(get_user_repository), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "gestor": raise HTTPException(403, "Acesso negado.")
    return {"success": True, "logs": repo.get_login_attempts(limit=limit, offset=offset)}

@router.get("/audit-logs")
def list_audit_logs(user_id: Optional[str] = None, action: Optional[str] = None, entity: Optional[str] = None, date_from: Optional[str] = Query(None, alias="date_from"), date_to: Optional[str] = Query(None, alias="date_to"), limit: int = 200, offset: int = 0, audit_service: AuditService = Depends(get_audit_service), current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "gestor": raise HTTPException(403, "Acesso negado.")
    return audit_service.get_logs({"user_id": user_id, "action": action, "entity": entity, "from": date_from, "to": date_to, "limit": limit, "offset": offset})