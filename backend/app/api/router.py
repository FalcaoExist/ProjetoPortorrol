import os
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Header,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
)
from jose import jwt

from app.api.schemas import (
    ConfigUpdate,
    FilialResponse,
    SkuAnaliseResponse,
    StatusProduto,
)
from app.core.dependencies import (
    get_audit_service,
    get_auth_service,
    get_current_user,
    get_user_repository,
    get_user_service,
)
from app.core.interfaces import IUserRepository
from app.core.supabase_client import supabase

# --- IMPORTS DO DASHBOARD (Novos da Feature) ---
from app.repositories.import_repository import process_import_file
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService
from app.services.dashboard_service import DashboardService
from app.services.service_models import UserCreateRequest, UserUpdateRequest
from app.services.user_service import UserService

# --- IMPORTS DE SCHEMAS (Locais) ---
from .schemas import (
    ChangePasswordRequest,
    # --- NOVOS SCHEMAS (SUPPLIER & ORDERS) ---
    FornecedorCreate,
    FornecedorResponse,
    LoginRequest,
    LoginResponse,
    PedidoCreate,
    PedidoResponse,
    UserCreateResponse,
    UserGetResponse,
    UserListResponse,
    UserUpdateResponse,
)

load_dotenv()

# --- CONFIGURAÇÕES DE SEGURANÇA E TOKEN (ADICIONADO) ---
SECRET_KEY = os.getenv("SECRET_KEY", "uma_chave_super_secreta_e_segura_123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 300  # 5 horas

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Gera um token JWT com tempo de expiração.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
# -------------------------------------------------------

router = APIRouter()

# --- LOGIN (Mantendo a versão DEV que é mais robusta com Log de IP) ---
@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest, 
    response: Response, 
    request: Request, 
    auth_service: AuthService = Depends(get_auth_service)
):
    # Pega o IP do cliente para log
    ip = request.client.host
    
    result = auth_service.check_credentials(data.email, data.password, ip_address=ip)
    
    if not result:
        # Nota: O auth_service geralmente já lança HTTPException, mas por segurança:
        return {"success": False, "message": "Credenciais inválidas", "user": None}

    # Gera o Token (AGORA A FUNÇÃO EXISTE)
    access_token = create_access_token(data={"sub": result["user_id"]})
    
    # --- CONFIGURAÇÃO DO COOKIE (A MÁGICA ESTÁ AQUI) ---
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,   # Impede acesso via JS (Segurança contra XSS)
        max_age=18000,   # 5 horas
        expires=18000,
        samesite="lax",  # "lax" é necessário para funcionar em localhost sem HTTPS
        secure=False     # False porque estamos rodando em HTTP local
    )
    # ---------------------------------------------------

    return {
        "success": True, 
        "user": result, 
        "message": "Login realizado com sucesso"
    }

# --- USERS (Mantendo a versão DEV que tem Auditoria e Permissões) ---
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
def list_users(
    name: Optional[str] = None,
    email: Optional[str] = None,
    user_service: UserService = Depends(get_user_service),
):
    return user_service.get_formatted_users(name, email)


@router.get("/users/all", response_model=UserListResponse)
def get_all_users(user_service: UserService = Depends(get_user_service)):
    return user_service.get_formatted_users()


@router.get("/users/{user_id}", response_model=UserGetResponse)
def get_user_by_id(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
):
    user = user_service.get_user_by_id(user_id)
    return {"success": True, "user": user}


@router.put("/users/{user_id}", response_model=UserUpdateResponse)
def update_user(
    user_id: str,
    data: UserUpdateRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    updated_user = user_service.update_existing_user(
        user_id, data, performed_by=current_user.get("user_id")
    )
    return {"success": True, "user": updated_user, "message": "Usuário atualizado com sucesso!"}


@router.delete("/users/{user_id}", status_code=204)
def delete_user_endpoint(
    user_id: str,
    service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Permissão negada.")
        
    service.delete_user_permanently(user_id, performed_by=current_user.get("user_id"))
    return None

# =================================================================
# ROTAS DE FORNECEDORES (Adaptadas para public.suppliers)
# =================================================================

@router.get("/suppliers", response_model=List[FornecedorResponse])
def get_suppliers_list(current_user: dict = Depends(get_current_user)):
    try:
        # Filtra apenas ativos
        response = supabase.table("suppliers").select("*").eq("is_active", True).order("name").execute()
        return response.data
    except Exception as e:
        print(f"Erro suppliers: {e}")
        return []

@router.post("/suppliers", response_model=FornecedorResponse)
def create_supplier(
    data: FornecedorCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Gera external_id se não vier, pois é UNIQUE no banco
        ext_id = data.external_id or str(uuid4())[:8]
        
        payload = {
            "name": data.name,
            "lead_time_days": data.lead_time_days,
            "is_active": True,
            "external_id": ext_id
        }
        response = supabase.table("suppliers").insert(payload).execute()
        return response.data[0]
    except Exception as e:
        # Tratamento de erro de duplicidade (Unique constraint)
        if "duplicate key" in str(e):
             raise HTTPException(status_code=400, detail="Fornecedor ou ID externo já existe.")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/suppliers/{id}")
def delete_supplier(id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Soft delete para não quebrar integridade referencial
        supabase.table("suppliers").update({"is_active": False}).eq("supplier_id", id).execute()
        return {"message": "Fornecedor inativado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# =================================================================
# ROTAS DE PEDIDOS (Adaptadas para purchase_orders + items)
# =================================================================

@router.get("/orders", response_model=List[PedidoResponse])
def get_orders(current_user: dict = Depends(get_current_user)):
    """
    Busca pedidos fazendo JOIN manual nas tabelas relacionais.
    """
    try:
        # Query complexa para trazer nomes relacionados
        query = """
            order_id, status, created_at, expected_delivery_date,
            suppliers!inner(name),
            purchase_order_items(
                quantity_ordered, unit_cost,
                tb_skus(nome_produto)
            )
        """
        response = supabase.table("purchase_orders").select(query).order("created_at", desc=True).execute()
        
        formatted_orders = []
        for row in response.data:
            # Pega o primeiro item (assumindo 1 item por pedido para simplificar interface)
            items = row.get("purchase_order_items", [])
            item = items[0] if items else {}
            sku = item.get("tb_skus") or {}
            
            formatted_orders.append({
                "order_id": row["order_id"],
                "status": row["status"],
                "created_at": row["created_at"],
                "supplier_name": row["suppliers"]["name"] if row["suppliers"] else "N/A",
                "item_name": sku.get("nome_produto") or "Item não encontrado",
                "quantity": item.get("quantity_ordered", 0),
                "total_value": float(item.get("unit_cost", 0)) * item.get("quantity_ordered", 0),
                "data_entrega": row.get("expected_delivery_date")
            })
            
        return formatted_orders
    except Exception as e:
        print(f"Erro orders: {e}")
        return []

@router.post("/orders", response_model=PedidoResponse)
def create_order(
    pedido: PedidoCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        # 1. Busca Supplier ID pelo Nome
        sup = supabase.table("suppliers").select("supplier_id").ilike("name", pedido.fornecedor_nome).execute()
        if not sup.data:
            raise HTTPException(400, f"Fornecedor '{pedido.fornecedor_nome}' não encontrado. Cadastre-o primeiro.")
        supplier_id = sup.data[0]["supplier_id"]

        # 2. Busca SKU ID pelo Código (ou Nome)
        # Tenta codigo exato primeiro
        sku = supabase.table("tb_skus").select("id, nome_produto").eq("codigo", pedido.sku_codigo).execute()
        if not sku.data:
             # Fallback: Tenta buscar pelo nome do produto
             sku = supabase.table("tb_skus").select("id, nome_produto").ilike("nome_produto", f"%{pedido.sku_codigo}%").execute()
        
        if not sku.data:
            raise HTTPException(400, f"Produto com código/nome '{pedido.sku_codigo}' não encontrado.")
        
        sku_id = sku.data[0]["id"]
        sku_name = sku.data[0]["nome_produto"]

        # 3. Cria Cabeçalho (Purchase Order)
        order_payload = {
            "supplier_id": supplier_id,
            "user_id": current_user["user_id"],
            "status": "DRAFT",
            "expected_delivery_date": str(pedido.previsao_entrega) if pedido.previsao_entrega else None
        }
        order_res = supabase.table("purchase_orders").insert(order_payload).execute()
        new_order = order_res.data[0]

        # 4. Cria Item (Purchase Order Item)
        item_payload = {
            "order_id": new_order["order_id"],
            "sku_id": sku_id,
            "quantity_ordered": pedido.quantidade,
            "unit_cost": pedido.valor_unitario
        }
        supabase.table("purchase_order_items").insert(item_payload).execute()

        # Retorno formatado
        return {
            "order_id": new_order["order_id"],
            "status": new_order["status"],
            "created_at": new_order["created_at"],
            "supplier_name": pedido.fornecedor_nome,
            "item_name": sku_name,
            "quantity": pedido.quantidade,
            "total_value": pedido.quantidade * pedido.valor_unitario,
            "data_entrega": new_order.get("expected_delivery_date")
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Erro critico criar pedido: {e}")
        raise HTTPException(500, f"Erro interno ao criar pedido: {str(e)}")

# --- AUXILIARES E NOVAS ROTAS (DA FEATURE DASHBOARD) ---

@router.get("/me", response_model=UserGetResponse)
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return { "success": True, "user": current_user }

# Helper rápido para tentar pegar o ID do usuário sem travar a request se falhar
async def get_user_id_safe(authorization: str = Header(None)):
    if not authorization: return None
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id if user and user.user else None
    except: return None

@router.post("/stock/import")
async def import_stock(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Envie um arquivo CSV")

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler upload: {e}")

    user_id = await get_user_id_safe(authorization)
    background_tasks.add_task(process_import_file, contents, user_id)

    return {
        "success": True,
        "message": "Upload recebido! O processamento continuará em segundo plano.",
        "status": "processing_started"
    }

# --- DASHBOARD ENDPOINTS (DA FEATURE DASHBOARD) ---

def get_dashboard_service():
    return DashboardService()
def get_dashboard_service():
    return DashboardService()

@router.get("/dashboard/skus", response_model=List[SkuAnaliseResponse])
def listar_skus_dashboard(
    status: Optional[StatusProduto] = Query(None),
    filial: Optional[str] = Query(None),
    fornecedor: Optional[str] = Query(None), # <--- NOVO PARAMETRO
    service: DashboardService = Depends(get_dashboard_service),
):
    """
    Retorna a lista de SKUs com seus status calculados.
    Permite filtrar por Status, Filial e Fornecedor.
    """
    return service.get_filtered_skus(
        status_filter=status.value if status else None,
        branch=filial,
        supplier=fornecedor
    )
    
@router.get("/dashboard/filiais", response_model=List[FilialResponse])
def listar_filiais_dashboard(service: DashboardService = Depends(get_dashboard_service)):
    return service.get_branches()

@router.post("/dashboard/config/lead-time")
def atualizar_lead_time(config: ConfigUpdate, service: DashboardService = Depends(get_dashboard_service)):
    """Define o Lead Time global para cálculos."""
    return service.update_lead_time(config.valor)

@router.post("/dashboard/config/orcamento")
def atualizar_orcamento(config: ConfigUpdate, service: DashboardService = Depends(get_dashboard_service)):
    """Define o Budget disponível."""
    return service.update_budget(config.valor)

@router.get("/dashboard/search", response_model=List[SkuAnaliseResponse])
def buscar_skus(
    q: str = Query(...),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.search_products(q)
    """
    faz uma busca de SKUs por Nome (parcial), Código (exato) ou ID.
    Retorna uma lista de resultados.
    """

@router.get("/dashboard/history")
def get_product_history(
    sku_id: Optional[int] = None, # <--- MUDANÇA: Agora aceita vazio (None)
    service: DashboardService = Depends(get_dashboard_service)
):
    """Retorna o histórico de vendas (Geral ou Por Produto)"""
    return service.get_sku_history(sku_id)
# --- NOVAS ROTAS DE AUDITORIA E LOGS (DA BRANCH DEV) ---

@router.get("/login-attempts")
def list_login_attempts(
    limit: int = 200,
    offset: int = 0,
    repo: IUserRepository = Depends(get_user_repository),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Apenas gestores podem acessar os registros.")

    logs = repo.get_login_attempts(limit=limit, offset=offset)
    return {"success": True, "logs": logs}

@router.get("/audit-logs")
def list_audit_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    entity: Optional[str] = None,
    date_from: Optional[str] = Query(None, alias="date_from"),
    date_to: Optional[str] = Query(None, alias="date_to"),
    limit: int = 200,
    offset: int = 0,
    audit_service: AuditService = Depends(get_audit_service),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "gestor":
        raise HTTPException(status_code=403, detail="Apenas gestores podem acessar os registros.")

    filters = {
        "user_id": user_id,
        "action": action,
        "entity": entity,
        "from": date_from,
        "to": date_to,
        "limit": limit,
        "offset": offset,
    }

    logs = audit_service.get_logs(filters)
    return {"success": True, "logs": logs}

@router.put("/me/password")
def change_own_password(
    data: ChangePasswordRequest,
    user_service: UserService = Depends(get_user_service),
    current_user: dict = Depends(get_current_user),
):
    user_service.change_password(
        user_id=current_user["user_id"],
        old_password=data.old_password,
        new_password=data.new_password,
        performed_by=current_user["user_id"]  # o próprio usuário
    )
    return {"success": True, "message": "Senha alterada com sucesso!"}