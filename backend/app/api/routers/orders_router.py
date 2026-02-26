from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_current_user,get_order_service, get_orders_repo
from app.services.order_service import OrderService
from app.api.schemas import BatchOrderRequest, BatchOrderResponse, OrderUpdate, PedidoCreate, PedidoResponse
from app.repositories.orders_repository import OrdersRepository

router = APIRouter()

@router.get("/orders")
def get_orders(orders_repo: OrdersRepository = Depends(get_orders_repo)):
    return orders_repo.get_all_orders()

@router.patch("/orders/{order_id}")
def update_order(order_id: str, order: OrderUpdate, orders_repo: OrdersRepository = Depends(get_orders_repo)):
    return orders_repo.update_order(order_id, order.model_dump(exclude_unset=True))

@router.put("/orders/{order_id}")
def update_order_put(order_id: str, order: OrderUpdate, orders_repo: OrdersRepository = Depends(get_orders_repo)):
    return update_order(order_id, order, orders_repo)


@router.post("/orders")
def create_order(pedido: PedidoCreate, current_user: dict = Depends(get_current_user), orders_repo: OrdersRepository = Depends(get_orders_repo)):
    # Enviamos o dicionário current_user completo
    return orders_repo.create_single_order(current_user, pedido)

@router.post("/orders/batch")
def create_batch_order(payload: BatchOrderRequest, current_user: dict = Depends(get_current_user), orders_repo: OrdersRepository = Depends(get_orders_repo)):
    # Enviamos o dicionário current_user completo
    return orders_repo.create_batch_order(current_user, payload.items)