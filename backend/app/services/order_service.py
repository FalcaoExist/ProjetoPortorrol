import logging
from typing import List, Any
from datetime import datetime
from itertools import groupby
from uuid import uuid4
from app.repositories.order_repository import OrdersRepository

logger = logging.getLogger(__name__)

class OrderService:
    def __init__(self):
        self.repository = OrdersRepository()

    def get_orders(self) -> List[dict]:
        """Retorna apenas pedidos manuais formatados."""
        try:
            resp = self.repository.get_orders()
            formatted = []
            
            for row in resp.data or []:
                sup_data = row.get("suppliers")
                items = row.get("purchase_order_items", [])
                
                item_data = items[0] if isinstance(items, list) and items else (items if isinstance(items, dict) else {})
                sku_data = item_data.get("tb_skus") or {}
                
                qty = item_data.get("quantity_ordered") or 0
                
                try:
                    cost = float(item_data.get("unit_cost") or 0.0)
                except (TypeError, ValueError):
                    cost = 0.0

                supplier_name = sup_data.get("name", "N/A") if isinstance(sup_data, dict) else "N/A"
                item_name = sku_data.get("nome_produto", "N/A") if isinstance(sku_data, dict) else "N/A"

                formatted.append({
                    "id": row.get("order_id"),
                    "order_id": row.get("order_id"),
                    "status": row.get("status"),
                    "created_at": row.get("created_at"),
                    "supplier_name": supplier_name,
                    "item_name": item_name,
                    "quantity": qty,
                    "total_value": qty * cost,
                    # Distinção clara conforme solicitado
                    "previsao_entrega": row.get("expected_delivery_date"), # Data de previsão
                    "data_entrega": row.get("data_entrega")                # Data real de entrega
                })
                
            return formatted
        except Exception as e:
            logger.error(f"Erro ao buscar pedidos manuais: {e}")
            raise

    def get_all_orders(self) -> List[dict]:
        """Retorna todos os pedidos (Manuais, NSK e TIMKEN) unificados e mapeados."""
        all_orders = []
        suppliers_map = {}
        skus_map = {}

        # Carregamento de dados auxiliares para evitar múltiplas queries
        try:
            res_sup = self.repository.get_all_suppliers()
            if res_sup and res_sup.data:
                suppliers_map = {s['supplier_id']: s['name'] for s in res_sup.data}
            
            res_sku = self.repository.get_all_skus()
            if res_sku and res_sku.data:
                skus_map = {k['id']: k['nome_produto'] for k in res_sku.data}
        except Exception as e:
            logger.error(f"Erro ao carregar dados auxiliares (fornecedores/skus): {e}")

        # 1. Processamento de Pedidos Manuais (purchase_orders)
        try:
            res_manual = self.repository.get_manual_orders()
            for row in (res_manual.data or []):
                order_id = row.get("order_id")
                items = row.get("purchase_order_items", [])
                if isinstance(items, dict): 
                    items = [items]
                
                for idx, i in enumerate(items or []):
                    qty = i.get("quantity_ordered") or 0
                    unit_cost = float(i.get("unit_cost") or 0)
                    
                    all_orders.append({
                        "id": f"{order_id}-{idx}",
                        "numero_pedido": f"MAN-{str(order_id)[:8].upper()}",
                        "responsavel": row.get("user_name") or "Sistema",
                        "supplier_name": suppliers_map.get(row.get("supplier_id"), "Manual"),
                        "item_name": skus_map.get(i.get("sku_id"), "Item"),
                        "quantity": qty,
                        "valor": float(qty) * unit_cost,
                        "status": row.get("status", "Pendente"),
                        "created_at": row.get("created_at"),
                        # Previsão (Expected) vs Entrega Real (data_entrega)
                        "previsao_entrega": row.get("expected_delivery_date"),
                        "data_entrega": row.get("data_entrega"),
                        "origem": "MANUAL",
                        "purchase_order_id": order_id
                    })
        except Exception as e:
            logger.error(f"Erro ao processar pedidos manuais: {e}")

        # 2. Processamento de Pedidos Importados: NSK
        try:
            res_nsk = self.repository.get_external_orders("orders_nsk")
            for row in (res_nsk.data or []):
                po_id = row.get("purchase_order_id")
                qty = row.get("qtde_confirmada") or row.get("qtd_solicitada") or 0
                price = float(row.get("preco_unitario") or 0)

                all_orders.append({
                    "id": row.get("id"),
                    "numero_pedido": row.get("ped_nsk") or row.get("ped_cli") or "NSK",
                    "responsavel": "Importado",
                    "supplier_name": "NSK",
                    "item_name": row.get("produto") or "S/C",
                    "quantity": qty,
                    "valor": float(qty) * price,
                    "status": "Vínculo Confirmado" if po_id else "Importado",
                    "created_at": row.get("data_solicitada") or row.get("created_at"),
                    # NSK: Solicitada é a previsão, data_entrega é o real
                    "previsao_entrega": row.get("data_solicitada"),
                    "data_entrega": row.get("data_entrega"),
                    "origem": "NSK",
                    "purchase_order_id": po_id
                })
        except Exception as e:
            logger.error(f"Erro ao processar pedidos NSK: {e}")

        # 3. Processamento de Pedidos Importados: TIMKEN
        try:
            res_timken = self.repository.get_external_orders("orders_timken")
            for row in (res_timken.data or []):
                po_id = row.get("purchase_order_id")
                qty = row.get("confirmed_qty") or row.get("open_qty") or 0
                price = float(row.get("sales_unit_price") or 0)

                all_orders.append({
                    "id": row.get("id"),
                    "numero_pedido": row.get("purchase_order_number") or row.get("sales_doc") or "TIMKEN",
                    "responsavel": "Importado",
                    "supplier_name": "TIMKEN",
                    "item_name": row.get("material_full_description") or row.get("material") or "S/C",
                    "quantity": qty,
                    "valor": float(qty) * price,
                    "status": row.get("status") or ("Vínculo Confirmado" if po_id else "Importado"),
                    "created_at": row.get("requested_date") or row.get("created_at"),
                    # TIMKEN: Requested é a previsão, delivery_date é o real
                    "previsao_entrega": row.get("requested_date"),
                    "data_entrega": row.get("delivery_date"),
                    "origem": "TIMKEN",
                    "purchase_order_id": po_id
                })
        except Exception as e:
            logger.error(f"Erro ao processar pedidos TIMKEN: {e}")

        all_orders.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return all_orders

    def create_order(self, pedido, current_user: dict) -> dict:
        """Cria um pedido manual individual."""
        sup = self.repository.get_supplier_by_name(pedido.fornecedor_nome)
        if not sup or not sup.data:
            logger.error(f"Fornecedor não encontrado: {pedido.fornecedor_nome}")
            raise ValueError("Fornecedor não encontrado.")
        supplier_id = sup.data[0]["supplier_id"]

        sku = self.repository.get_sku_by_codigo(pedido.sku_codigo)
        if not sku.data:
            sku = self.repository.search_sku_by_nome(pedido.sku_codigo)
        
        if not sku.data:
            logger.error(f"Produto não encontrado para código/nome: {pedido.sku_codigo}")
            raise ValueError("Produto não encontrado.")

        sku_id, sku_name = sku.data[0]["id"], sku.data[0]["nome_produto"]

        try:
            order_res = self.repository.insert_order({
                "supplier_id": supplier_id,
                "user_id": current_user.get("user_id"),
                "user_name": current_user.get("name") or current_user.get("email"),
                "status": "DRAFT",
                # Garante que a previsão vai para a coluna correta
                "expected_delivery_date": str(pedido.previsao_entrega) if pedido.previsao_entrega else None,
                "data_entrega": None # Inicialmente nula
            })
            new_order = order_res.data[0]

            self.repository.insert_order_items({
                "order_id": new_order["order_id"],
                "sku_id": sku_id,
                "quantity_ordered": pedido.quantidade,
                "unit_cost": pedido.valor_unitario
            })

            return {
                "id": new_order["order_id"], 
                "order_id": new_order["order_id"], 
                "status": new_order["status"],
                "created_at": new_order["created_at"], 
                "supplier_name": pedido.fornecedor_nome,
                "item_name": sku_name, 
                "quantity": pedido.quantidade,
                "total_value": pedido.quantidade * pedido.valor_unitario, 
                "previsao_entrega": new_order.get("expected_delivery_date"),
                "data_entrega": None
            }
        except Exception as e:
            logger.error(f"Erro ao inserir pedido no banco: {e}")
            raise

    def create_batch_orders(self, payload_items: List[Any], current_user: dict) -> int:
        """Cria pedidos manuais em lote agrupados por fornecedor e filial."""
        try:
            all_suppliers = self.repository.get_all_suppliers()
            supplier_map = {s["name"].upper().strip(): s["supplier_id"] for s in all_suppliers.data}

            all_branches = self.repository.get_all_branches()
            branch_map = {}
            if all_branches and all_branches.data:
                for b in all_branches.data:
                    b_id = b.get("branch_id") or b.get("id")
                    if b.get("name") and b_id:
                        branch_map[b["name"].upper().strip()] = b_id

            items_with_supplier = []
            for item_obj in payload_items:
                item = item_obj.model_dump() if hasattr(item_obj, "model_dump") else dict(item_obj)
                
                raw_name = item.get("supplier_name") or "Fornecedor Genérico"
                sup_key = raw_name.upper().strip()

                if sup_key not in supplier_map:
                    new_sup = self.repository.insert_supplier({
                        "name": raw_name, "is_active": True, "external_id": str(uuid4())[:8]
                    })
                    supplier_map[sup_key] = new_sup.data[0]["supplier_id"]

                item_copy = dict(item)
                item_copy["supplier_id"] = supplier_map[sup_key]

                raw_branch = item.get("branch_name") or "Matriz"
                branch_key = raw_branch.upper().strip()

                if branch_key not in branch_map:
                    try:
                        new_branch = self.repository.insert_branch({"name": raw_branch, "is_active": True})
                        if new_branch and new_branch.data:
                            branch_map[branch_key] = new_branch.data[0].get("branch_id")
                    except Exception as e:
                        logger.error(f"Erro ao criar filial {raw_branch}: {e}")

                item_copy["target_branch_id"] = branch_map.get(branch_key)
                items_with_supplier.append(item_copy)

            items_with_supplier.sort(key=lambda x: (x["supplier_id"], str(x.get("target_branch_id"))))
            count = 0
            for (supplier_id, branch_id), group in groupby(items_with_supplier, key=lambda x: (x["supplier_id"], x.get("target_branch_id"))):
                group_items = list(group)
                res_order = self.repository.insert_order({
                    "supplier_id": supplier_id,
                    "user_id": current_user.get("user_id"),
                    "user_name": current_user.get("name") or current_user.get("email"),
                    "status": "PENDING",
                    "expected_delivery_date": group_items[0].get('expected_delivery_date'),
                    "target_branch_id": branch_id
                })
                if res_order.data:
                    new_id = res_order.data[0]["order_id"]
                    count += 1
                    payloads = [{"order_id": new_id, "sku_id": i["sku_id"], "quantity_ordered": i["quantity"], "unit_cost": i["unit_cost"]} for i in group_items]
                    self.repository.insert_order_items(payloads)
            
            return count
        except Exception as e:
            logger.error(f"Erro ao processar criação de pedidos em lote: {e}")
            raise

    def update_order(self, order_id: str, payload: Any):
        try:
            update_dict = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else dict(payload)
            
            origem = update_dict.pop("origem", "MANUAL").upper()
            
            if origem == "TIMKEN":
                table = "orders_timken"
                if "data_entrega" in update_dict:
                    update_dict["delivery_date"] = update_dict.pop("data_entrega")
            elif origem == "NSK":
                table = "orders_nsk"
            else:
                table = "purchase_orders"

            return self.repository.update_external_order(table, order_id, update_dict)
            
        except Exception as e:
            logger.error(f"Erro ao atualizar pedido {order_id} ({origem}): {e}")
            raise