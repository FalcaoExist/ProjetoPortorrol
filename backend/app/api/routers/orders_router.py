from typing import List
from fastapi import APIRouter, Depends

from app.core.dependencies import (
    get_current_user,
    get_order_service,
    get_order_aggregate_repository,
)

from app.services.order_service import OrderService
from app.repositories.order_aggregate_repository import OrderAggregateRepository
from app.api.schemas import (
    BatchOrderRequest,
    BatchOrderResponse,
    OrderUpdate,
    PedidoCreate,
    PedidoResponse,
)

router = APIRouter()

@router.get("/orders")
def get_orders(
    service: OrderService = Depends(get_order_service)
):
    return service.get_all_orders()

@router.patch("/orders/{order_id}")
def update_order(
    order_id: str,
    order: OrderUpdate,
    service: OrderService = Depends(get_order_service),
):
    return service.update_order(order_id, order)

@router.put("/orders/{order_id}")
def update_order_put(
    order_id: str,
    order: OrderUpdate,
    service: OrderService = Depends(get_order_service),
):
    return service.update_order(order_id, order)

@router.post("/orders")
def create_order(
    pedido: PedidoCreate,
    current_user: dict = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return service.create_order(pedido, current_user)

@router.post("/orders/batch")
def create_batch_order(
    payload: BatchOrderRequest,
    current_user: dict = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return service.create_batch_orders(payload.items, current_user)