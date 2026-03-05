import logging
from typing import List, Any, Dict
from datetime import datetime
from itertools import groupby
from uuid import uuid4
from app.repositories.order_repository import OrdersRepository

logger = logging.getLogger(__name__)

class OrderService:
    def __init__(self):
        self.repository = OrdersRepository()

    def get_orders(self) -> List[dict]:
        """Retorna apenas pedidos manuais formatados com todas as colunas da FEATURE."""
        try:
            resp = self.repository.get_orders()
            formatted = []
            
            for row in resp.data or []:
                sup_data = row.get("suppliers")
                items = row.get("purchase_order_items", [])
                
                # Tratamento robusto para item único ou lista de itens
                item_data = items[0] if isinstance(items, list) and items else (items if isinstance(items, dict) else {})
                sku_data = item_data.get("tb_skus") or {}
                
                qty = item_data.get("quantity_ordered") or 0
                
                try:
                    cost = float(item_data.get("unit_cost") or 0.0)
                except (TypeError, ValueError):
                    logger.debug("Falha ao converter unit_cost para float")
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
                    "previsao_entrega": row.get("expected_delivery_date"),
                    "data_entrega": row.get("data_entrega")
                })
                
            return formatted
        except Exception as e:
            logger.error(f"Erro ao buscar pedidos manuais: {e}")
            raise

    def get_all_orders(self) -> List[dict]:
        """Retorna todos os pedidos unificados (Feature) com o mapeamento integral da DEV."""
        all_orders = []
        suppliers_map = {}
        skus_map = {}
        branches_map = {}

        try:
            res_sup = self.repository.get_all_suppliers()
            if res_sup and hasattr(res_sup, 'data') and res_sup.data:
                suppliers_map = {s['supplier_id']: s['name'] for s in res_sup.data if isinstance(s, dict)}

            res_branch = self.repository.get_all_branches()
            if res_branch and hasattr(res_branch, 'data') and res_branch.data:
                for b in res_branch.data:
                    if isinstance(b, dict):
                        # Conforme o seu DDL, o campo é 'branch_id'
                        b_id = b.get('branch_id') or b.get('id')
                        if b_id:
                            branches_map[str(b_id)] = b.get('name')

            res_sku = self.repository.get_all_skus()
            if res_sku and hasattr(res_sku, 'data') and res_sku.data:
                skus_map = {k['id']: k['nome_produto'] for k in res_sku.data if isinstance(k, dict)}
        except Exception:
            logger.exception("Erro ao carregar dados auxiliares")

        try:
            res_manual = self.repository.get_manual_orders()
            for row in (res_manual.data or []):
                order_id = row.get("order_id")
                raw_date = row.get("created_at")
                nome_responsavel = row.get("user_name") or "Sistema"
                nome_fornecedor = suppliers_map.get(row.get("supplier_id"), "Manual")
                
                # Resolução do nome da filial a partir do UUID target_branch_id
                nome_filial = branches_map.get(str(row.get("target_branch_id")), "Matriz")
                
                items_do_pedido = row.get("purchase_order_items", [])
                if isinstance(items_do_pedido, dict):
                    items_do_pedido = [items_do_pedido]

                if items_do_pedido:
                    for idx, i in enumerate(items_do_pedido):
                        if not isinstance(i, dict): continue
                        p_sku_id = i.get("sku_id")
                        nome_item_real = skus_map.get(p_sku_id, f"Item {p_sku_id}")
                        qtd_real = i.get("quantity_ordered") or 0
                        unit_cost = i.get("unit_cost") or 0
                        
                        all_orders.append({
                            "id": f"{order_id}-{p_sku_id}-{idx}", 
                            "numero_pedido": f"MAN-{str(order_id)[:8].upper()}",
                            "responsavel": nome_responsavel,
                            "supplier_name": nome_fornecedor,
                            "item_name": nome_item_real,
                            "branch_name": nome_filial,
                            "quantity": qtd_real,
                            "valor": float(qtd_real) * float(unit_cost),
                            "status": row.get("status", "Pendente"),
                            "created_at": raw_date,
                            "previsao_entrega": row.get("expected_delivery_date"), 
                            "data_entrega": row.get("data_entrega"),
                            "origem": "MANUAL",
                            "purchase_order_id": order_id
                        })
                else:
                    # Tratamento DEV para pedidos sem itens
                    all_orders.append({
                        "id": str(order_id), 
                        "numero_pedido": f"MAN-{str(order_id)[:8].upper()}",
                        "responsavel": nome_responsavel,
                        "supplier_name": nome_fornecedor,
                        "item_name": "Pedido sem itens",
                        "branch_name": nome_filial,
                        "quantity": 0,
                        "valor": 0.0,
                        "status": row.get("status", "Pendente"),
                        "created_at": raw_date,
                        "origem": "MANUAL",
                        "purchase_order_id": order_id
                    })
        except Exception:
            logger.exception("Erro ao carregar pedidos manuais")

        # Processamento de Pedidos Importados (NSK/TIMKEN)
        for table, label in [("orders_nsk", "NSK"), ("orders_timken", "TIMKEN")]:
            try:
                res = self.repository.get_external_orders(table)
                for row in (res.data or []):
                    po_id = row.get("purchase_order_id")
                    if label == "NSK":
                        qty = row.get("qtde_confirmada") or row.get("qtd_solicitada") or 0
                        price = float(row.get("preco_unitario") or 0)
                        prev, real, num = row.get("data_solicitada"), row.get("data_entrega"), row.get("ped_nsk") or "NSK"
                        item = row.get("produto")
                    else:
                        qty = row.get("confirmed_qty") or row.get("open_qty") or 0
                        price = float(row.get("sales_unit_price") or 0)
                        prev, real, num = row.get("requested_date"), row.get("delivery_date"), row.get("purchase_order_number") or "TIMKEN"
                        item = row.get("material_full_description")

                    all_orders.append({
                        "id": row.get("id"),
                        "numero_pedido": num,
                        "responsavel": "Importado",
                        "supplier_name": label,
                        "item_name": item or "S/C",
                        "quantity": qty,
                        "valor": float(qty) * price,
                        "status": "Vínculo Confirmado" if po_id else "Importado",
                        "created_at": prev or row.get("created_at"),
                        "previsao_entrega": prev,
                        "data_entrega": real,
                        "origem": label,
                        "purchase_order_id": po_id
                    })
            except Exception:
                logger.exception(f"Erro em {label}")

        all_orders.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return all_orders

    def create_order(self, pedido, current_user: dict) -> dict:
        """Cria pedido manual preservando a lógica detalhada de resposta."""
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

        # Resolução da Filial para obter o UUID branch_id
        branch_id = None
        nome_filial = getattr(pedido, 'branch_name', None) or getattr(pedido, 'filial', None) or "Matriz"
        res_branches = self.repository.get_all_branches()
        if res_branches and res_branches.data:
            for b in res_branches.data:
                # Compara o nome da tabela com o nome recebido (Insensível a caixa/espaços)
                if str(b.get("name", "")).upper().strip() == nome_filial.upper().strip():
                    branch_id = b.get("branch_id") or b.get("id")
                    break

        try:
            # Gravando no banco: Coluna target_branch_id recebe o UUID branch_id
            order_res = self.repository.insert_order({
                "supplier_id": supplier_id,
                "user_id": current_user.get("user_id"),
                "user_name": current_user.get("name") or current_user.get("email"),
                "status": "DRAFT",
                "expected_delivery_date": str(pedido.previsao_entrega) if pedido.previsao_entrega else None,
                "data_entrega": None,
                "target_branch_id": branch_id
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
                "branch_name": nome_filial
            }
        except Exception as e:
            logger.error(f"Erro ao inserir pedido individual: {e}")
            raise

    def create_batch_orders(self, payload_items: List[Any], current_user: dict) -> int:
        """Cria pedidos em lote unindo a criação dinâmica da Feature e mapeamento da DEV."""
        all_suppliers = self.repository.get_all_suppliers()
        supplier_map = {s["name"].upper().strip(): s["supplier_id"] for s in all_suppliers.data if isinstance(s, dict)}

        branches_response = self.repository.get_all_branches()
        branch_map = {}
        if branches_response and branches_response.data:
            for b in branches_response.data:
                b_id = b.get('branch_id') or b.get('id')
                if b.get('name') and b_id:
                    branch_map[str(b['name']).upper().strip()] = b_id

        items_with_supplier = []
        for item_obj in payload_items:
            item = item_obj.model_dump() if hasattr(item_obj, "model_dump") else dict(item_obj)
            
            sup_name = item.get("supplier_name") or "Fornecedor Genérico"
            sup_key = sup_name.upper().strip()
            if sup_key not in supplier_map:
                new_sup = self.repository.insert_supplier({"name": sup_name, "is_active": True, "external_id": str(uuid4())[:8]})
                supplier_map[sup_key] = new_sup.data[0]["supplier_id"]

            raw_branch = item.get("branch_name") or item.get("filial") or "Matriz"
            branch_key = str(raw_branch).upper().strip()
            if branch_key not in branch_map:
                new_branch = self.repository.insert_branch({"name": raw_branch, "is_active": True})
                branch_map[branch_key] = new_branch.data[0].get("branch_id") or new_branch.data[0].get("id")

            item["supplier_id"] = supplier_map[sup_key]
            item["target_branch_id"] = branch_map.get(branch_key)
            items_with_supplier.append(item)

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

    def update_order(self, order_id: str, payload: Any):
        """Atualização de pedidos respeitando origens externas."""
        try:
            update_dict = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else dict(payload)
            origem = str(update_dict.pop("origem", "MANUAL")).upper()
            table = "orders_timken" if origem == "TIMKEN" else ("orders_nsk" if origem == "NSK" else "purchase_orders")
            if origem == "TIMKEN" and "data_entrega" in update_dict:
                update_dict["delivery_date"] = update_dict.pop("data_entrega")
            return self.repository.update_order(order_id, update_dict)
        except Exception as e:
            logger.error(f"Erro ao atualizar pedido {order_id}: {e}")
            raise