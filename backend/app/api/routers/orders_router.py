from fastapi import APIRouter, Depends

from app.core.dependencies import (
    get_current_user,
    get_order_service,
)

from app.services.order_service import OrderService
from app.api.schemas import (
    BatchOrderRequest,
    OrderUpdate,
    PedidoCreate,
)

router = APIRouter(tags=["Orders"], dependencies=[Depends(get_current_user)])

@router.get(
    "/orders",
    summary="Listar pedidos",
    description="Retorna a lista de pedidos cadastrados no sistema.",
    responses={
        200: {
            "description": "Pedidos retornados com sucesso",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": "00000000-0000-4000-8000-000000000001-1001-0",
                            "numero_pedido": "MAN-EXAMPLE01",
                            "responsavel": "Usuário Exemplo",
                            "supplier_name": "SUPPLIER_DEMO_A",
                            "item_name": "ITEM_DEMO_001",
                            "branch_name": "BRANCH_DEMO_A",
                            "quantity": 30,
                            "valor": 300.0,
                            "status": "Pendente",
                            "created_at": "2026-04-01T10:00:00",
                            "previsao_entrega": "2026-04-10",
                            "data_entrega": None,
                            "origem": "MANUAL",
                            "purchase_order_id": "00000000-0000-4000-8000-000000000001"
                        }
                    ]
                }
            },
        },
        500: {"description": "Erro interno ao listar pedidos"},
    },
)
def get_orders(
    service: OrderService = Depends(get_order_service)
):
    return service.get_all_orders()

@router.patch(
    "/orders/{order_id}",
    summary="Atualizar pedido (PATCH)",
    description="Atualiza parcialmente campos de um pedido pelo identificador.",
    responses={
        200: {
            "description": "Pedido atualizado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "order_id": "00000000-0000-4000-8000-000000000001",
                        "status": "Pendente",
                        "data_entrega": "2026-04-12",
                    }
                }
            },
        },
        404: {"description": "Pedido não encontrado"},
        422: {"description": "Dados inválidos"},
    },
)
def update_order(
    order_id: str,
    order: OrderUpdate,
    service: OrderService = Depends(get_order_service),
):
    return service.update_order(order_id, order)

@router.put(
    "/orders/{order_id}",
    summary="Atualizar pedido (PUT)",
    description="Atualiza um pedido pelo identificador, substituindo os campos enviados.",
    responses={
        200: {
            "description": "Pedido atualizado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "order_id": "00000000-0000-4000-8000-000000000001",
                        "status": "Aprovado",
                        "data_entrega": "2026-04-15",
                    }
                }
            },
        },
        404: {"description": "Pedido não encontrado"},
        422: {"description": "Dados inválidos"},
    },
)
def update_order_put(
    order_id: str,
    order: OrderUpdate,
    service: OrderService = Depends(get_order_service),
):
    return service.update_order(order_id, order)

@router.post(
    "/orders",
    summary="Criar pedido",
    description="Cria um novo pedido de compra para um SKU e fornecedor.",
    responses={
        200: {
            "description": "Pedido criado com sucesso",
            "content": {
                "application/json": {
                    "example": {
                        "id": "00000000-0000-4000-8000-000000000111",
                        "order_id": "00000000-0000-4000-8000-000000000111",
                        "status": "DRAFT",
                        "supplier_name": "SUPPLIER_DEMO_A",
                        "item_name": "ITEM_DEMO_001",
                        "quantity": 100,
                        "total_value": 1050.0,
                        "branch_name": "BRANCH_DEMO_A",
                        "created_at": "2026-04-01T10:00:00Z",
                    }
                }
            },
        },
        401: {"description": "Não autenticado"},
        422: {"description": "Dados inválidos"},
    },
)
def create_order(
    pedido: PedidoCreate,
    current_user: dict = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return service.create_order(pedido, current_user)

@router.post(
    "/orders/batch",
    summary="Criar pedidos em lote",
    description="Cria múltiplos pedidos em uma única requisição.",
    responses={
        200: {
            "description": "Lote processado com sucesso",
            "content": {
                "application/json": {
                    "example": 2
                }
            },
        },
        401: {"description": "Não autenticado"},
        422: {"description": "Dados inválidos"},
    },
)
def create_batch_order(
    payload: BatchOrderRequest,
    current_user: dict = Depends(get_current_user),
    service: OrderService = Depends(get_order_service),
):
    return service.create_batch_orders(payload.items, current_user)