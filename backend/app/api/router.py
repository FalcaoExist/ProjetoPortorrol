from typing import List, Optional, Annotated
from uuid import uuid4
from itertools import groupby

from fastapi import (
    APIRouter, BackgroundTasks, Depends, File, Header, 
    HTTPException, Query, Request, Response, UploadFile, Path
)
from dotenv import load_dotenv
from app.core.security import create_access_token 
from app.core.supabase_client import supabase

from app.api.schemas import (
    ConfigUpdate, FilialResponse, SkuAnaliseResponse, StatusProduto,
)
from app.core.dependencies import (
    get_audit_service, get_auth_service, get_current_user,
    get_user_repository, get_user_service,
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

# Schemas Locais
from .schemas import (
    BatchOrderRequest, BatchOrderResponse, ChangePasswordRequest,
    FornecedorCreate, FornecedorResponse, LoginRequest,
    LoginResponse, PedidoCreate, PedidoResponse, StockItemResponse,
    UserCreateResponse, UserGetResponse, UserListResponse, UserUpdateResponse,
)

# --- INICIALIZAÇÃO ---
load_dotenv()
router = APIRouter()

# --- HELPERS ---
async def get_user_id_safe(authorization: str = Header(None)):
    if not authorization: return None
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id if user and user.user else None
    except: return None

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


@router.get("/suppliers", response_model=List[FornecedorResponse])
def get_suppliers_list(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("suppliers").select("*").eq("is_active", True).order("name").execute()
        return response.data
    except Exception as e:
        return []

@router.post("/suppliers", response_model=FornecedorResponse)
def create_supplier(data: FornecedorCreate, current_user: dict = Depends(get_current_user)):
    try:
        ext_id = data.external_id or str(uuid4())[:8]
        payload = {"name": data.name, "lead_time_days": data.lead_time_days, "is_active": True, "external_id": ext_id}
        response = supabase.table("suppliers").insert(payload).execute()
        return response.data[0]
    except Exception as e:
        if "duplicate key" in str(e):
             raise HTTPException(status_code=400, detail="Fornecedor ou ID externo já existe.")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/suppliers/{id}")
def delete_supplier(id: str, current_user: dict = Depends(get_current_user)):
    try:
        supabase.table("suppliers").update({"is_active": False}).eq("supplier_id", id).execute()
        return {"message": "Fornecedor inativado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# PEDIDOS E ESTOQUE

@router.get("/orders", response_model=List[PedidoResponse])
def get_orders(current_user: dict = Depends(get_current_user)):
    try:
        query = """
            order_id, status, created_at, expected_delivery_date,
            suppliers(name),
            purchase_order_items(
                quantity_ordered, unit_cost,
                tb_skus(nome_produto)
            )
        """
        response = supabase.table("purchase_orders").select(query).order("created_at", desc=True).execute()
        
        formatted_orders = []
        for row in response.data:
            sup_data = row.get("suppliers")
            items = row.get("purchase_order_items", [])
            item_data = items[0] if items else {}
            sku_data = item_data.get("tb_skus") or {}
            qty = item_data.get("quantity_ordered") or 0
            cost = float(item_data.get("unit_cost") or 0.0)

            formatted_orders.append({
                "id": row["order_id"],
                "order_id": row["order_id"],
                "status": row["status"],
                "created_at": row["created_at"],
                "supplier_name": sup_data["name"] if sup_data else "N/A",
                "item_name": sku_data.get("nome_produto") or "N/A",
                "quantity": qty,
                "total_value": qty * cost,
                "data_entrega": row.get("expected_delivery_date")
            })
        return formatted_orders
    except Exception:
        return []

@router.post("/orders", response_model=PedidoResponse)
def create_order(pedido: PedidoCreate, current_user: dict = Depends(get_current_user)):
    try:
        # Busca Supplier
        sup = supabase.table("suppliers").select("supplier_id").ilike("name", pedido.fornecedor_nome).execute()
        if not sup.data: raise HTTPException(400, "Fornecedor não encontrado.")
        supplier_id = sup.data[0]["supplier_id"]

        # Busca SKU
        sku = supabase.table("tb_skus").select("id, nome_produto").eq("codigo", pedido.sku_codigo).execute()
        if not sku.data:
             sku = supabase.table("tb_skus").select("id, nome_produto").ilike("nome_produto", f"%{pedido.sku_codigo}%").execute()
        if not sku.data: raise HTTPException(400, "Produto não encontrado.")
        
        sku_id, sku_name = sku.data[0]["id"], sku.data[0]["nome_produto"]

        # Insert Order
        order_res = supabase.table("purchase_orders").insert({
            "supplier_id": supplier_id, "user_id": current_user["user_id"],
            "status": "DRAFT", "expected_delivery_date": str(pedido.previsao_entrega) if pedido.previsao_entrega else None
        }).execute()
        new_order = order_res.data[0]

        # Insert Item
        supabase.table("purchase_order_items").insert({
            "order_id": new_order["order_id"], "sku_id": sku_id,
            "quantity_ordered": pedido.quantidade, "unit_cost": pedido.valor_unitario
        }).execute()

        return {
            "id": new_order["order_id"], "order_id": new_order["order_id"], "status": new_order["status"],
            "created_at": new_order["created_at"], "supplier_name": pedido.fornecedor_nome,
            "item_name": sku_name, "quantity": pedido.quantidade,
            "total_value": pedido.quantidade * pedido.valor_unitario, "data_entrega": new_order.get("expected_delivery_date")
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/orders/batch", response_model=BatchOrderResponse)
def create_batch_order(payload: BatchOrderRequest, current_user: dict = Depends(get_current_user)):
    if not payload.items: raise HTTPException(400, "Nenhum item enviado.")
    try:
        all_suppliers = supabase.table("suppliers").select("supplier_id, name").execute()
        supplier_map = {s["name"].upper().strip(): s["supplier_id"] for s in all_suppliers.data}

        items_with_supplier = []
        for item in payload.items:
            raw_name = item.supplier_name or "Fornecedor Genérico"
            sup_key = raw_name.upper().strip()
            
            if sup_key not in supplier_map:
                new_sup = supabase.table("suppliers").insert({
                    "name": raw_name, "is_active": True, "lead_time_days": 30, "external_id": str(uuid4())[:8]
                }).execute()
                supplier_map[sup_key] = new_sup.data[0]["supplier_id"]

            item_dict = item.dict()
            item_dict['supplier_id'] = supplier_map[sup_key]
            items_with_supplier.append(item_dict)

        items_with_supplier.sort(key=lambda x: x["supplier_id"])
        count = 0
        for supplier_id, group in groupby(items_with_supplier, key=lambda x: x["supplier_id"]):
            group_items = list(group)
            res_order = supabase.table("purchase_orders").insert({
                "supplier_id": supplier_id, "user_id": current_user["user_id"],
                "status": "PENDING", "expected_delivery_date": group_items[0]['expected_delivery_date']
            }).execute()
            
            if res_order.data:
                new_id = res_order.data[0]['order_id']
                count += 1
                payloads = [{"order_id": new_id, "sku_id": i['sku_id'], "quantity_ordered": i['quantity'], "unit_cost": i['unit_cost']} for i in group_items]
                supabase.table("purchase_order_items").insert(payloads).execute()

        return {"success": True, "message": "Pedidos criados!", "orders_created": count}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/stock", response_model=List[StockItemResponse])
def get_stock_data(filial: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    try:
        query = supabase.table("tb_analise_compra").select("*")
        if filial: query = query.eq("filial_id", filial)
        analise_data = query.limit(500).execute().data
        if not analise_data: return []

        sku_ids = [item['sku_id'] for item in analise_data if item.get('sku_id')]
        skus_res = supabase.table("tb_skus").select("id, codigo, nome_produto, classificacao").in_("id", sku_ids).execute()
        skus_map = {s['id']: s for s in skus_res.data}

        suppliers_res = supabase.table("product_suppliers").select("sku_id, suppliers(name)").in_("sku_id", sku_ids).execute()
        sku_supplier_map = {item['sku_id']: item['suppliers']['name'] for item in suppliers_res.data if item.get('suppliers')}

        result = []
        for row in analise_data:
            sid = row.get('sku_id')
            sku_info = skus_map.get(sid, {})
            est = row.get('estoque_soma', 0) or 0
            dem = row.get('demanda_soma', 0) or 1
            dias = int(est / (dem / 30)) if dem > 0 else 999

            result.append({
                "id": sid, "codigo": sku_info.get("codigo", "S/C"), "item": sku_info.get("nome_produto", "Desconhecido"),
                "categoria": sku_info.get("classificacao", "Geral"), "unidades": est,
                "fornecedor": sku_supplier_map.get(sid, "Sem Vínculo"), "filial": row.get("filial_id", "Matriz"),
                "dias_cobertura": dias, "valor": 0.0
            })
        return result
    except Exception:
        return []


# DASHBOARD E IMPORTAÇÃO


@router.post("/stock/import")
async def import_stock(background_tasks: BackgroundTasks, file: UploadFile = File(...), authorization: str = Header(None)):
    if not file.filename.lower().endswith(".csv"): raise HTTPException(400, "Envie um arquivo CSV")
    contents = await file.read()
    user_id = await get_user_id_safe(authorization)
    background_tasks.add_task(process_import_file, contents, user_id)
    return {"success": True, "message": "Processamento iniciado em segundo plano."}

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