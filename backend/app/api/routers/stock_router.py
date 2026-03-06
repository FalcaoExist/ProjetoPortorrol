from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.dependencies import get_current_user, get_stock_service
from app.services.stock_service import StockService
from app.api.schemas import StockItemResponse

router = APIRouter()

@router.get("/stock")
def get_stock_endpoint(
    filial: Optional[str] = None,
    fornecedor: Optional[str] = None,
    status: Optional[str] = None,
    limit: Optional[int] = Query(default=None, ge=1),
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


@router.get("/stock/skus/no-pending-units")
def get_stock_with_no_pending_units_endpoint(
    filial: Optional[str] = None,
    fornecedor: Optional[str] = None,
    limit: Optional[int] = Query(default=None, ge=1),
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
