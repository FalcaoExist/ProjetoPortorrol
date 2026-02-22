from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user,get_order_service
from app.services.order_service import OrderService
from app.api.schemas import BatchOrderRequest, BatchOrderResponse, PedidoCreate, PedidoResponse

router = APIRouter()

@router.get("/orders", response_model=List[PedidoResponse], operation_id="list_orders")
def get_orders(current_user: dict = Depends(get_current_user), order_service: OrderService = Depends(get_order_service)):
    return order_service.get_orders()

@router.post("/orders", response_model=PedidoResponse)
def create_order(pedido: PedidoCreate, current_user: dict = Depends(get_current_user), order_service: OrderService = Depends(get_order_service)):
    try:
        return order_service.create_order(pedido, current_user)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/orders/batch", response_model=BatchOrderResponse)
def create_batch_order(payload: BatchOrderRequest, current_user: dict = Depends(get_current_user), order_service: OrderService = Depends(get_order_service)):
    if not payload.items:
        raise HTTPException(400, "Nenhum item enviado.")
    try:
        items = [item.dict() for item in payload.items]
        count = order_service.create_batch_orders(items, current_user)
        return {"success": True, "message": "Pedidos criados!", "orders_created": count}
    except Exception as e:
        raise HTTPException(500, str(e))
