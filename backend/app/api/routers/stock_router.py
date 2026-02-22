from typing import List, Optional
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user, get_stock_service
from app.services.stock_service import StockService
from app.api.schemas import StockItemResponse

router = APIRouter()

@router.get("/stock", response_model=List[StockItemResponse], operation_id="get_stock_data")
def get_stock_data(filial: Optional[str] = None, current_user: dict = Depends(get_current_user), stock_service: StockService = Depends(get_stock_service)):
    return stock_service.get_stock_data(filial)