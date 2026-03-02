from typing import List
from itertools import groupby
from uuid import uuid4
from app.repositories.order_repository import OrderRepository

class OrderService:
    
    def __init__(self):
        self.repository = OrderRepository()
    
    def get_orders(self) -> List[dict]:
        try:
            resp = self.repository.get_orders()
            formatted = []
            
            for row in resp.data or []:
                sup_data = row.get("suppliers")
                items = row.get("purchase_order_items", [])
                item_data = items[0] if items else {}
                sku_data = item_data.get("tb_skus") or {}
                
                qty = item_data.get("quantity_ordered") or 0
                cost = float(item_data.get("unit_cost") or 0.0)

                formatted.append({
                    "id": row["order_id"],
                    "order_id": row["order_id"],
                    "status": row["status"],
                    "created_at": row["created_at"],
                    "supplier_name": sup_data["name"] if sup_data else "N/A",
                    "item_name": sku_data.get("nome_produto") or "N/A",
                    "quantity": qty,
                    "total_value": qty * cost,
                    "data_entrega": row.get("expected_delivery_date")
                })
                
            return formatted
        
        except Exception:
            return []

    def create_order(self, pedido, current_user: dict) -> dict:
        
        sup = self.repository.get_supplier_by_name(pedido.fornecedor_nome)
        if not (sup.data):
            raise ValueError("Fornecedor não encontrado.")
        supplier_id = sup.data[0]["supplier_id"]

        sku = self.repository.get_sku_by_codigo(pedido.sku_codigo)
        if not sku.data:
            sku = self.repository.search_sku_by_nome(pedido.sku_codigo)
        if not sku.data:
            raise ValueError("Produto não encontrado.")

        sku_id, sku_name = sku.data[0]["id"], sku.data[0]["nome_produto"]

        order_res = self.repository.insert_order({
            "supplier_id": supplier_id,
            "user_id": current_user["user_id"],
            "status": "DRAFT",
            "expected_delivery_date": str(pedido.previsao_entrega) if pedido.previsao_entrega else None
        })
        new_order = order_res.data[0]

        self.repository.insert_order_items({
            "order_id": new_order["order_id"],
            "sku_id": sku_id,
            "quantity_ordered": pedido.quantidade,
            "unit_cost": pedido.valor_unitario
        })

        return {
            "id": new_order["order_id"], "order_id": new_order["order_id"], "status": new_order["status"],
            "created_at": new_order["created_at"], "supplier_name": pedido.fornecedor_nome,
            "item_name": sku_name, "quantity": pedido.quantidade,
            "total_value": pedido.quantidade * pedido.valor_unitario, "data_entrega": new_order.get("expected_delivery_date")
        }

    def create_batch_orders(self, payload_items: List[dict], current_user: dict) -> int:
        
        all_suppliers = self.repository.get_all_suppliers()
        supplier_map = {s["name"].upper().strip(): s["supplier_id"] for s in all_suppliers.data}

        items_with_supplier = []
        for item in payload_items:
            raw_name = item.get("supplier_name") or "Fornecedor Genérico"
            sup_key = raw_name.upper().strip()

            if sup_key not in supplier_map:
                new_sup = self.repository.insert_supplier({
                    "name": raw_name,
                    "is_active": True,
                    "lead_time_days": 30,
                    "external_id": str(uuid4())[:8]
                })
                supplier_map[sup_key] = new_sup.data[0]["supplier_id"]

            item_copy = dict(item)
            item_copy["supplier_id"] = supplier_map[sup_key]
            items_with_supplier.append(item_copy)

        items_with_supplier.sort(key=lambda x: x["supplier_id"])
        count = 0
        for supplier_id, group in groupby(items_with_supplier, key=lambda x: x["supplier_id"]):
            group_items = list(group)
            
            res_order = self.repository.insert_order({
                "supplier_id": supplier_id,
                "user_id": current_user["user_id"],
                "status": "PENDING",
                "expected_delivery_date": group_items[0].get('expected_delivery_date')
            })
            if res_order.data:
                new_id = res_order.data[0]["order_id"]
                count += 1
                payloads = [{"order_id": new_id, "sku_id": i["sku_id"], "quantity_ordered": i["quantity"], "unit_cost": i["unit_cost"]} for i in group_items]
                self.repository.insert_order_items(payloads)

        return count