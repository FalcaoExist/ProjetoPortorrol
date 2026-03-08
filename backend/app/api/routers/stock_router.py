from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import get_current_user, get_stock_service
from app.services.stock_service import StockService
from app.api.schemas import StockItemResponse

router = APIRouter(tags=["Stock"])

@router.get(
    "/stock",
    summary="Listar estoque",
    description="Retorna itens de estoque com filtros opcionais por filial, fornecedor e status.",
    response_model=List[StockItemResponse],
    responses={
        200: {
            "description": "Estoque retornado com sucesso",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1001,
                            "codigo": "SKU-EXAMPLE-001",
                            "item": "ITEM_DEMO_001",
                            "categoria": "Geral",
                            "unidades": 120,
                            "fornecedor": "SUPPLIER_DEMO_A",
                            "filial": "BRANCH_DEMO_A",
                            "dias_cobertura": 30,
                            "valor": 2500.0,
                            "pedidos_pendentes": 0,
                            "estoque_projetado": 120,
                            "dias_cobertura_projetado": 30.0,
                            "quantidade_sugerida_compra_projetada": 0,
                        }
                    ]
                }
            },
        },
        401: {"description": "Não autenticado"},
        500: {"description": "Erro interno ao buscar estoque"},
    },
)
def get_stock_endpoint(
    filial: Optional[str] = Query(default=None, description="Filtrar por filial"),
    fornecedor: Optional[str] = Query(default=None, description="Filtrar por fornecedor"),
    status: Optional[str] = Query(default=None, description="Filtrar por status"),
    limit: Optional[int] = Query(default=None, ge=1, description="Limite máximo de itens retornados"),
    current_user: dict = Depends(get_current_user),
    stock_service: StockService = Depends(get_stock_service)
):
    try:
        # O router apenas chama a função do serviço e devolve o resultado
        return stock_service.get_stock(
            filial=filial, 
            fornecedor=fornecedor, 
            status=status, 
            limit=limit,
            current_user=current_user
        )
    except Exception as e:
        # Captura erros do serviço e converte num erro HTTP para o Frontend
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estoque: {str(e)}")


@router.get(
    "/stock/skus/no-pending-units",
    summary="Listar SKUs sem unidades pendentes",
    description="Retorna itens de estoque com unidades pendentes iguais a zero.",
    response_model=List[StockItemResponse],
    responses={
        200: {
            "description": "Itens retornados com sucesso",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1002,
                            "codigo": "SKU-EXAMPLE-002",
                            "item": "ITEM_DEMO_002",
                            "categoria": "Geral",
                            "unidades": 80,
                            "fornecedor": "SUPPLIER_DEMO_B",
                            "filial": "BRANCH_DEMO_B",
                            "dias_cobertura": 25,
                            "valor": 1800.0,
                            "pedidos_pendentes": 0,
                            "estoque_projetado": 80,
                            "dias_cobertura_projetado": 25.0,
                            "quantidade_sugerida_compra_projetada": 0,
                        }
                    ]
                }
            },
        },
        401: {"description": "Não autenticado"},
        500: {"description": "Erro interno ao buscar itens"},
    },
)
def get_stock_with_no_pending_units_endpoint(
    filial: Optional[str] = Query(default=None, description="Filtrar por filial"),
    fornecedor: Optional[str] = Query(default=None, description="Filtrar por fornecedor"),
    limit: Optional[int] = Query(default=None, ge=1, description="Limite máximo de itens retornados"),
    current_user: dict = Depends(get_current_user),
    stock_service: StockService = Depends(get_stock_service)
):
    try:
        return stock_service.get_stock(
            filial=filial,
            fornecedor=fornecedor,
            limit=limit,
            current_user=current_user,
            unidades_pendentes=0,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar SKUs com unidades pendentes zeradas: {str(e)}")
