from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.api.schemas import (
    ConfigUpdate, FilialResponse, SkuAnaliseResponse, StatusProduto,
)
from app.services.dashboard_service import DashboardService

router = APIRouter()

def get_dashboard_service():
    return DashboardService()

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