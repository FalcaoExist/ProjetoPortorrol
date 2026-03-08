from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.schemas import (
    ConfigUpdate, FilialResponse, SkuAnaliseResponse, StatusProduto,
)
from app.services.dashboard_service import DashboardService
from app.core.dependencies import get_current_user, get_dashboard_service

router = APIRouter(tags=["Dashboard"])

@router.get(
    "/dashboard/search",
    summary="Buscar SKUs",
    description="Realiza busca textual de SKUs para uso em autocomplete e filtros.",
    responses={
        200: {
            "description": "Busca concluída com sucesso",
            "content": {
                "application/json": {
                    "example": [{"sku_id": 1001, "codigo": "SKU-EXAMPLE-001", "nome_produto": "ITEM_DEMO_001"}]
                }
            },
        },
        422: {"description": "Parâmetros inválidos"},
        500: {"description": "Erro interno na busca"},
    },
)
def search_skus(
    term: str = Query(..., min_length=1, description="Texto de busca"), 
    service: DashboardService = Depends(get_dashboard_service)
):
    try:
        return service.search_products(term)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na busca: {str(e)}")

@router.get(
    "/dashboard/skus",
    response_model=List[SkuAnaliseResponse],
    summary="Listar SKUs do dashboard",
    description="Retorna SKUs com métricas para o dashboard, com filtros opcionais.",
    responses={
        200: {
            "description": "SKUs retornados com sucesso",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "sku_id": 1001,
                            "codigo": "SKU-EXAMPLE-001",
                            "nome_produto": "ITEM_DEMO_001",
                            "marca": "BRAND_DEMO",
                            "classificacao": "A",
                            "atendimento": 0.92,
                            "status": "OK",
                            "sugestao_compra": 0,
                            "estoque_soma": 120,
                            "demanda_soma": 98.0,
                            "filial_nome": "BRANCH_DEMO_A",
                        }
                    ]
                }
            },
        }
    },
)
def listar_skus_dashboard(
    status: Optional[StatusProduto] = Query(None, description="Filtrar por status"), 
    filial: Optional[str] = Query(None, description="Filtrar por filial"), 
    fornecedor: Optional[str] = Query(None, description="Filtrar por fornecedor"), 
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_filtered_skus(status_filter=status.value if status else None, branch=filial, supplier=fornecedor)

@router.get(
    "/dashboard/filiais",
    response_model=List[FilialResponse],
    summary="Listar filiais",
    description="Retorna a lista de filiais disponíveis para filtros de dashboard.",
    responses={200: {"description": "Filiais retornadas com sucesso", "content": {"application/json": {"example": [{"id": "00000000-0000-4000-8000-000000000020", "nome": "BRANCH_DEMO_A"}]}}}},
)
def listar_filiais_dashboard(service: DashboardService = Depends(get_dashboard_service)):
    return service.get_branches()

@router.post(
    "/dashboard/config/lead-time",
    summary="Atualizar lead time",
    description="Atualiza configuração de lead time usada nos cálculos do dashboard.",
    responses={200: {"description": "Configuração atualizada com sucesso", "content": {"application/json": {"example": {"success": True, "message": "Lead time atualizado."}}}}, 422: {"description": "Payload inválido"}},
)
def atualizar_lead_time(config: ConfigUpdate, service: DashboardService = Depends(get_dashboard_service)):
    return service.update_lead_time(config.valor)

@router.get(
    "/dashboard/history",
    summary="Obter histórico de SKU",
    description="Retorna histórico de vendas/métricas para um SKU específico ou visão geral.",
    responses={200: {"description": "Histórico retornado com sucesso", "content": {"application/json": {"example": [{"periodo": "2026-03", "quantidade": 42, "valor": 880.0}]}}}},
)
def get_product_history(
    sku_id: Optional[int] = Query(default=None, description="ID do SKU"),
    service: DashboardService = Depends(get_dashboard_service),
):
    return service.get_sku_history(sku_id)

@router.get(
    "/dashboard/config/{key}",
    summary="Obter configuração",
    description="Retorna valor de uma configuração por chave.",
    responses={200: {"description": "Configuração retornada com sucesso", "content": {"application/json": {"example": {"chave": "lead_time", "valor": "30"}}}}, 401: {"description": "Não autenticado"}},
)
async def get_config(
    key: str, 
    current_user: dict = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service)
):
    config = service.get_configuration(key)
    if not config:
        return {"chave": key, "valor": "0"}
    return config

@router.get(
    "/dashboard/budget",
    summary="Obter contexto de orçamento",
    description="Retorna dados de orçamento do dashboard com filtro opcional por fornecedor.",
    responses={200: {"description": "Contexto de orçamento retornado com sucesso", "content": {"application/json": {"example": {"supplier": "SUPPLIER_DEMO_A", "budget_total": 10000.0, "budget_used": 2400.0}}}}},
)
async def get_dashboard_budget(
    supplier: Optional[str] = Query(None, description="Filtrar por fornecedor"),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_budget_context(supplier)

@router.get(
    "/dashboard/suppliers/status",
    response_model=List[Dict[str, Any]],
    operation_id="get_supplier_status",
    summary="Obter status de fornecedores",
    description="Retorna status consolidado dos fornecedores ou de um fornecedor específico.",
    responses={200: {"description": "Status retornado com sucesso", "content": {"application/json": {"example": [{"supplier": "SUPPLIER_DEMO_A", "status": "ok", "score": 0.93}]}}}, 500: {"description": "Erro interno ao buscar status"}},
)
def get_supplier_status(
    supplier_name: Optional[str] = Query(None, description="Nome do fornecedor"),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    try:
        if supplier_name:
            return dashboard_service.get_supplier_status_by_name(supplier_name)
        return dashboard_service.get_supplier_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar status dos fornecedores: {str(e)}")

@router.get(
    "/dashboard/critics",
    response_model=List[Dict[str, Any]],
    summary="Obter itens críticos",
    description="Retorna SKUs em situação crítica para decisão de compra.",
    responses={200: {"description": "Itens críticos retornados com sucesso", "content": {"application/json": {"example": [{"sku_id": 1002, "codigo": "SKU-EXAMPLE-002", "status": "RUPTURA", "sugestao_compra": 80}]}}}},
)
def get_critical_items(
    limit: int = Query(20, ge=1, description="Quantidade máxima de itens"),
    supplier: Optional[str] = Query(None, description="Filtrar por fornecedor"),
    no_pending_only: bool = Query(False, description="Retornar apenas itens sem unidades pendentes"),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_critical_items(limit=limit, supplier=supplier, no_pending_only=no_pending_only)

@router.get(
    "/dashboard/excess",
    response_model=List[Dict[str, Any]],
    summary="Obter itens com excesso",
    description="Retorna SKUs com excesso de estoque.",
    responses={200: {"description": "Itens com excesso retornados com sucesso", "content": {"application/json": {"example": [{"sku_id": 1003, "codigo": "SKU-EXAMPLE-003", "status": "EXCESSO", "estoque_soma": 300}]}}}},
)
def get_excess_items(
    limit: int = Query(20, ge=1, description="Quantidade máxima de itens"),
    supplier: Optional[str] = Query(None, description="Filtrar por fornecedor"),
    service: DashboardService = Depends(get_dashboard_service)
):
    return service.get_excess_items(limit=limit, supplier=supplier)