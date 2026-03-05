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
                    logger.debug("Falha ao converter unit_cost para float")
                    cost = 0.0

                supplier_name = "N/A"
                if isinstance(sup_data, dict):
                    supplier_name = sup_data.get("name", "N/A")
                elif isinstance(sup_data, list) and sup_data:
                    supplier_name = sup_data[0].get("name", "N/A")

                item_name = "N/A"
                if isinstance(sku_data, dict):
                    item_name = sku_data.get("nome_produto", "N/A")
                elif isinstance(sku_data, list) and sku_data:
                    item_name = sku_data[0].get("nome_produto", "N/A")

                formatted.append({
                    "id": row.get("order_id"),
                    "order_id": row.get("order_id"),
                    "status": row.get("status"),
                    "created_at": row.get("created_at"),
                    "supplier_name": supplier_name,
                    "item_name": item_name,
                    "quantity": qty,
                    "total_value": cost,
                    "data_entrega": row.get("expected_delivery_date")
                })
                
            return formatted
        except Exception:
            logger.exception("Erro ao buscar pedidos")
            raise

    def get_all_orders(self) -> List[dict]:
        all_orders = []
        suppliers_map = {}
        branches_map = {}
        skus_map = {}

        try:
            res_sup = self.repository.get_all_suppliers()
            if res_sup and hasattr(res_sup, 'data') and res_sup.data:
                suppliers_map = {s['supplier_id']: s['name'] for s in res_sup.data if isinstance(s, dict)}

            res_branch = self.repository.get_all_branches()
            if res_branch and hasattr(res_branch, 'data') and res_branch.data:
                for b in res_branch.data:
                    if isinstance(b, dict):
                        b_id = b.get('id') or b.get('branch_id') or b.get('filial_id')
                        if b_id:
                            branches_map[str(b_id)] = b.get('name')

            res_sku = self.repository.get_all_skus()
            if res_sku and hasattr(res_sku, 'data') and res_sku.data:
                skus_map = {k['id']: k['nome_produto'] for k in res_sku.data if isinstance(k, dict)}
        except Exception:
            logger.exception("Erro ao carregar dados auxiliares (suppliers, branches, skus)")

        try:
            res_manual = self.repository.get_manual_orders()
            linhas_manuais = res_manual.data if hasattr(res_manual, 'data') else res_manual
            
            for row in (linhas_manuais or []):
                if not isinstance(row, dict): continue
                
                order_id = row.get("order_id")
                sup_id = row.get("supplier_id")
                
                raw_date = row.get("created_at") or row.get("inserted_at") or datetime.now().isoformat()
                nome_fornecedor = suppliers_map.get(sup_id, f"Fornecedor {sup_id}")
                
                nome_responsavel = row.get("user_name")
                if not nome_responsavel:
                    u_id_raw = row.get("user_id")
                    u_id_str = str(u_id_raw) if u_id_raw else None
                    nome_responsavel = f"Usuário {u_id_str[:8]}" if u_id_str else "Sistema"
                
                items_do_pedido = row.get("purchase_order_items", [])
                if isinstance(items_do_pedido, dict):
                    items_do_pedido = [items_do_pedido]
                
                if items_do_pedido and isinstance(items_do_pedido, list):
                    for idx, i in enumerate(items_do_pedido):
                        if not isinstance(i, dict): continue
                        p_sku_id = i.get("sku_id")
                        nome_item_real = skus_map.get(p_sku_id, f"Item {p_sku_id}")
                        qtd_real = i.get("quantity_ordered") or 0
                        unit_cost = i.get("unit_cost") or 0
                        try:
                            total_real = float(unit_cost)
                        except (TypeError, ValueError):
                            logger.debug("Falha ao converter unit_cost para float")
                            total_real = 0.0
                        
                        unique_id = f"{order_id}-{p_sku_id}-{idx}"

                        all_orders.append({
                            "id": unique_id, 
                            "real_id": order_id, 
                            "numero_pedido": f"MAN-{str(order_id)[:8]}",
                            "responsavel": nome_responsavel,
                            "supplier_name": nome_fornecedor,
                            "item_name": nome_item_real,
                            "branch_name": branches_map.get(str(row.get("target_branch_id")), "Matriz"),
                            "quantity": qtd_real,
                            "valor": total_real,
                            "status": row.get("status", "Aprovado"),
                            "created_at": raw_date,
                            "previsao_entrega": row.get("expected_delivery_date"), 
                            "data_entrega": row.get("data_entrega") if row.get("status") in ["Aprovado", "Finalizado"] else None, 
                            "origem": "MANUAL"
                        })
                else:
                    all_orders.append({
                        "id": order_id, 
                        "real_id": order_id,
                        "numero_pedido": f"MAN-{str(order_id)[:8]}",
                        "responsavel": nome_responsavel,
                        "supplier_name": nome_fornecedor,
                        "item_name": "Pedido sem itens",
                        "branch_name": branches_map.get(str(row.get("target_branch_id")), "Matriz"),
                        "quantity": row.get("quantity_ordered", 0),
                        "valor": 0,
                        "status": row.get("status", "Aprovado"),
                        "created_at": raw_date,
                        "previsao_entrega": row.get("expected_delivery_date"), 
                        "data_entrega": row.get("data_entrega") if row.get("status") in ["Aprovado", "Finalizado"] else None, 
                        "origem": "MANUAL"
                    })
        except Exception:
            logger.exception("Erro ao carregar pedidos manuais")
            raise

        for table, label in [("orders_nsk", "NSK"), ("orders_timken", "TIMKEN")]:
            try:
                res = self.repository.get_external_orders(table)
                linhas_ext = res.data if hasattr(res, 'data') else res
                for row in (linhas_ext or []):
                    if not isinstance(row, dict): continue
                    d = row.get("created_at") or datetime.now().isoformat()
                    all_orders.append({
                        "id": row.get("id"), 
                        "real_id": row.get("id"),
                        "numero_pedido": row.get("pedido_nsk") or row.get("po_number") or label,
                        "responsavel": "Sistema",
                        "supplier_name": label.title(), 
                        "item_name": row.get("produto") or row.get("material"),
                        "valor": 0, 
                        "quantity": row.get("qtd_confirmada", 0),
                        "status": "Aprovado", 
                        "created_at": d, 
                        "origem": label
                    })
            except Exception:
                logger.exception("Erro ao carregar pedidos externos da tabela %s", table)
                continue

        all_orders.sort(key=lambda x: str(x.get("created_at")), reverse=True)
        return all_orders

    def update_order(self, order_id: str, payload: Any):
        try:
            update_dict = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload
            return self.repository.update_order(order_id, update_dict)
        except Exception as e:
            logger.error(f"Erro ao atualizar pedido {order_id}: {e}")
            raise

    def create_order(self, pedido, current_user: dict) -> dict:
        sup = self.repository.get_supplier_by_name(pedido.fornecedor_nome)
        if not sup or not sup.data:
            logger.warning("Fornecedor não encontrado: %s", pedido.fornecedor_nome)
            raise ValueError("Fornecedor não encontrado.")
        supplier_id = sup.data[0]["supplier_id"]

        sku = self.repository.get_sku_by_codigo(pedido.sku_codigo)
        if not sku.data:
            sku = self.repository.search_sku_by_nome(pedido.sku_codigo)
        if not sku.data:
            logger.warning("Produto não encontrado: %s", pedido.sku_codigo)
            raise ValueError("Produto não encontrado.")

        sku_id, sku_name = sku.data[0]["id"], sku.data[0]["nome_produto"]

        order_res = self.repository.insert_order({
            "supplier_id": supplier_id,
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("name") or current_user.get("nome") or current_user.get("email"),
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
            "total_value": pedido.valor_unitario, "data_entrega": new_order.get("expected_delivery_date")
        }

    def create_batch_orders(self, payload_items: List[Any], current_user: dict) -> int:
        
        logger.info(
            "Iniciando criação de pedidos em lote - usuário: %s - quantidade de itens: %d",
            current_user.get("user_id"),
            len(payload_items),
        )

        all_suppliers = self.repository.get_all_suppliers()
        supplier_map = {s["name"].upper().strip(): s["supplier_id"] for s in all_suppliers.data}

        items_with_supplier = []
        branches_response = self.repository.get_all_branches()
        branch_by_name = {}
        if branches_response and hasattr(branches_response, "data") and branches_response.data:
            for branch in branches_response.data:
                if not isinstance(branch, dict):
                    continue
                branch_name = str(branch.get("name") or "").strip()
                branch_id = branch.get("id") or branch.get("branch_id") or branch.get("filial_id")
                if branch_name and branch_id:
                    branch_by_name[branch_name.upper()] = branch_id

        for item_obj in payload_items:
            if hasattr(item_obj, "model_dump"):
                item = item_obj.model_dump()
            elif hasattr(item_obj, "dict"):
                item = item_obj.dict()
            else:
                item = dict(item_obj)

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
            filial_nome = str(item.get("filial") or "").strip()
            item_copy["target_branch_id"] = branch_by_name.get(filial_nome.upper()) if filial_nome else None
            items_with_supplier.append(item_copy)

        items_with_supplier.sort(key=lambda x: (x["supplier_id"], str(x.get("target_branch_id") or "")))
        count = 0
        for (supplier_id, target_branch_id), group in groupby(
            items_with_supplier,
            key=lambda x: (x["supplier_id"], x.get("target_branch_id")),
        ):
            group_items = list(group)
            
            res_order = self.repository.insert_order({
                "supplier_id": supplier_id,
                "user_id": current_user.get("user_id"),
                "user_name": current_user.get("name") or current_user.get("nome") or current_user.get("email"),
                "status": "PENDING",
                "expected_delivery_date": group_items[0].get('expected_delivery_date'),
                "target_branch_id": target_branch_id,
            })
            if res_order.data:
                new_id = res_order.data[0]["order_id"]
                count += 1
                payloads = [{"order_id": new_id, "sku_id": i["sku_id"], "quantity_ordered": i["quantity"], "unit_cost": i["unit_cost"]} for i in group_items]
                self.repository.insert_order_items(payloads)

        logger.info(
            "Pedidos em lote criados com sucesso - usuário: %s - pedidos criados: %d",
            current_user.get("user_id"),
            count,
        )

        return count