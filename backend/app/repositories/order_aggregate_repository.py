import logging
from datetime import datetime
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class OrderAggregateRepository:

    EXTERNAL_TABLES = [
        ("orders_nsk", "NSK"),
        ("orders_timken", "TIMKEN"),
    ]

    def get_all_orders(self):
        all_orders = []

        try:
            res_manual = (
                supabase
                .table("purchase_orders")
                .select("*, purchase_order_items(*)")
                .order("created_at", desc=True)
                .execute()
            )

            for row in (res_manual.data or []):
                created_at = row.get("created_at") or datetime.now().isoformat()

                all_orders.append({
                    "id": row.get("order_id"),
                    "real_id": row.get("order_id"),
                    "numero_pedido": f"MAN-{str(row.get('order_id'))[:8]}",
                    "status": row.get("status"),
                    "created_at": created_at,
                    "origem": "MANUAL"
                })

        except Exception:
            logger.exception("Erro ao buscar pedidos manuais (purchase_orders)")
            raise

        for table, label in self.EXTERNAL_TABLES:
            try:
                res = supabase.table(table).select("*").execute()

                for row in (res.data or []):
                    created_at = row.get("created_at") or datetime.now().isoformat()

                    all_orders.append({
                        "id": row.get("id"),
                        "real_id": row.get("id"),
                        "numero_pedido": row.get("pedido_nsk") or row.get("po_number") or label,
                        "status": "Aprovado",
                        "created_at": created_at,
                        "origem": label
                    })

            except Exception:
                logger.exception(
                    "Erro ao buscar pedidos externos - tabela: %s",
                    table,
                )
                continue

        all_orders.sort(
            key=lambda x: x.get("created_at") or "",
            reverse=True
        )

        return all_orders