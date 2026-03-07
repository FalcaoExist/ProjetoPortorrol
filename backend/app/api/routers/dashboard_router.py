from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.schemas import (
    ConfigUpdate, FilialResponse, SkuAnaliseResponse, StatusProduto,
)
from app.services.dashboard_service import DashboardService
from app.core.dependencies import get_current_user, get_dashboard_service

router = APIRouter()

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
def listar_skus_dashboard(
    status: Optional[StatusProduto] = Query(None), 
    filial: Optional[str] = Query(None), 
    fornecedor: Optional[str] = Query(None), 
    service: DashboardService = Depends(get_dashboard_service)
):
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

@router.get("/dashboard/config/{key}")
async def get_config(
    key: str, 
    current_user: dict = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service)
):
    config = service.get_configuration(key)
    if not config:
        return {"chave": key, "valor": "0"}
    return config

@router.get("/dashboard/budget")
async def get_dashboard_budget(
    supplier: Optional[str] = Query(None),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_budget_context(supplier)

@router.get("/dashboard/suppliers/status", response_model=List[Dict[str, Any]], operation_id="get_supplier_status")
def get_supplier_status(
    supplier_name: Optional[str] = Query(None),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    try:
        if supplier_name:
            return dashboard_service.get_supplier_status_by_name(supplier_name)
        return dashboard_service.get_supplier_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar status dos fornecedores: {str(e)}")

@router.get("/dashboard/critics", response_model=List[Dict[str, Any]])
def get_critical_items(
    limit: int = 20,
    supplier: Optional[str] = Query(None),
    no_pending_only: bool = Query(False),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_critical_items(limit=limit, supplier=supplier, no_pending_only=no_pending_only)

@router.get("/dashboard/excess", response_model=List[Dict[str, Any]])
def get_excess_items(
    limit: int = 20,
    supplier: Optional[str] = Query(None),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_excess_items(limit=limit, supplier=supplier)