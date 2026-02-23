from app.core.supabase_client import supabase
from datetime import datetime
from uuid import uuid4
from itertools import groupby
import traceback
from fastapi import HTTPException

class OrdersRepository:
    def __init__(self):
        self.table_header = "purchase_orders"
        self.table_items = "purchase_order_items"

    def get_all_orders(self):
        all_orders = []
        suppliers_map = {}
        branches_map = {}
        skus_map = {}

        try:
            res_sup = supabase.table("suppliers").select("supplier_id, name").execute()
            if res_sup.data: suppliers_map = {s['supplier_id']: s['name'] for s in res_sup.data}

            res_branch = supabase.table("branches").select("*").execute()
            if res_branch.data:
                for b in res_branch.data:
                    b_id = b.get('id') or b.get('branch_id') or b.get('filial_id')
                    if b_id: branches_map[b_id] = b.get('name')

            res_sku = supabase.table("tb_skus").select("id, nome_produto").execute()
            if res_sku.data: skus_map = {k['id']: k['nome_produto'] for k in res_sku.data}
        except Exception as e:
            print(f"Erro caches gerais: {e}")

        try:
            res_manual = supabase.table(self.table_header).select("*, purchase_order_items(*)").execute()
            for row in (res_manual.data or []):
                order_id = row.get("order_id")
                sup_id = row.get("supplier_id")
                
                raw_date = row.get("created_at") or row.get("inserted_at") or datetime.now().isoformat()
                nome_fornecedor = suppliers_map.get(sup_id, f"Fornecedor {sup_id}")
                
                # A SUA IDEIA AQUI: Puxa o nome direto da coluna que criamos!
                nome_responsavel = row.get("user_name")
                
                # Fallback apenas para os pedidos antigos que foram criados antes dessa coluna existir
                if not nome_responsavel:
                    u_id_raw = row.get("user_id")
                    u_id_str = str(u_id_raw) if u_id_raw else None
                    nome_responsavel = f"Usuário {u_id_str[:8]}" if u_id_str else "Sistema"
                
                items_do_pedido = row.get("purchase_order_items", [])
                
                if items_do_pedido:
                    for idx, i in enumerate(items_do_pedido):
                        p_sku_id = i.get("sku_id")
                        nome_item_real = skus_map.get(p_sku_id, f"Item {p_sku_id}")
                        qtd_real = i.get("quantity_ordered") or 0
                        unit_cost = i.get("unit_cost") or 0
                        total_real = float(qtd_real) * float(unit_cost)
                        
                        unique_id = f"{order_id}-{p_sku_id}-{idx}"

                        all_orders.append({
                            "id": unique_id, 
                            "real_id": order_id, 
                            "numero_pedido": f"MAN-{str(order_id)[:8]}",
                            "responsavel": nome_responsavel,
                            "supplier_name": nome_fornecedor,
                            "item_name": nome_item_real,
                            "branch_name": branches_map.get(row.get("target_branch_id"), "Matriz"),
                            "quantity": qtd_real,
                            "valor": total_real,
                            "status": row.get("status", "Aprovado"),
                            "created_at": raw_date,
                            "previsao_entrega": row.get("expected_delivery_date"), 
                            "data_entrega": row.get("expected_delivery_date") if row.get("status") == "Aprovado" else None, 
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
                        "branch_name": branches_map.get(row.get("target_branch_id"), "Matriz"),
                        "quantity": row.get("quantity_ordered", 0),
                        "valor": 0,
                        "status": row.get("status", "Aprovado"),
                        "created_at": raw_date,
                        "previsao_entrega": row.get("expected_delivery_date"), 
                        "data_entrega": row.get("expected_delivery_date") if row.get("status") == "Aprovado" else None, 
                        "origem": "MANUAL"
                    })
        except Exception as e:
            print(f"Erro purchase_orders: {e}")

        # Busca NSK e Timken
        for table, label in [("orders_nsk", "NSK"), ("orders_timken", "TIMKEN")]:
            try:
                res = supabase.table(table).select("*").execute()
                for row in (res.data or []):
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
            except: pass

        all_orders.sort(key=lambda x: str(x.get("created_at")), reverse=True)
        return all_orders

    def update_order(self, order_id: str, order_obj):
        try:
            if isinstance(order_obj, dict):
                data = order_obj
            else:
                data = order_obj.model_dump(exclude_unset=True) if hasattr(order_obj, 'model_dump') else order_obj.dict(exclude_unset=True)
            
            update_payload = {}
            
            if "data_entrega" in data: 
                update_payload["expected_delivery_date"] = data["data_entrega"]
                
            if "status" in data: 
                update_payload["status"] = data["status"]
            
            if not update_payload: return {"message": "Nada para atualizar"}
            
            supabase.table(self.table_header).update(update_payload).eq("order_id", order_id).execute()
            return {"message": "Atualizado com sucesso", "id": order_id, "updated": update_payload}
            
        except Exception as e:
            print(f"🔥 ERRO AO ATUALIZAR PEDIDO {order_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao salvar no banco: {str(e)}")

    def create_single_order(self, current_user, pedido):
        try:
            sup = supabase.table("suppliers").select("supplier_id").ilike("name", pedido.fornecedor_nome).execute()
            if not sup.data: raise HTTPException(status_code=400, detail="Fornecedor não encontrado")
            
            sku = supabase.table("tb_skus").select("id, nome_produto").eq("codigo", pedido.sku_codigo).execute()
            if not sku.data: raise HTTPException(status_code=400, detail="Produto não encontrado")

            # --- EXTRAÇÃO BLINDADA DO NOME ---
            if isinstance(current_user, str):
                user_id = str(uuid4())
                user_name = current_user
            else:
                user_id = current_user.get("user_id") or current_user.get("id") or current_user.get("sub") or str(uuid4())
                # Adicionamos "username" e outras variações para garantir que apanha o "dionatas"
                user_name = current_user.get("username") or current_user.get("nome") or current_user.get("name") or current_user.get("email") or "Dionatas"

            order_res = supabase.table(self.table_header).insert({
                "supplier_id": sup.data[0]["supplier_id"],
                "user_id": user_id,
                "user_name": user_name, # GRAVA O NOME AQUI
                "status": "Aprovado", 
                "created_at": datetime.now().isoformat(),
                "expected_delivery_date": str(pedido.previsao_entrega) if pedido.previsao_entrega else None
            }).execute()
            
            new_order = order_res.data[0]
            supabase.table(self.table_items).insert({
                "order_id": new_order["order_id"],
                "sku_id": sku.data[0]["id"],
                "quantity_ordered": getattr(pedido, 'quantidade', getattr(pedido, 'quantity', 0)),
                "unit_cost": getattr(pedido, 'valor_unitario', getattr(pedido, 'unit_cost', 0))
            }).execute()
            
            return new_order
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def create_batch_order(self, current_user, items: list):
        if not items: raise HTTPException(status_code=400, detail="Nenhum item enviado.")
        
        try:
            # --- EXTRAÇÃO BLINDADA DO NOME ---
            if isinstance(current_user, str):
                user_id = str(uuid4())
                user_name = current_user
            else:
                user_id = current_user.get("user_id") or current_user.get("id") or current_user.get("sub") or str(uuid4())
                user_name = current_user.get("username") or current_user.get("nome") or current_user.get("name") or current_user.get("email") or "Dionatas"

            all_suppliers = supabase.table("suppliers").select("supplier_id, name").execute()
            supplier_map = {s["name"].upper().strip(): s["supplier_id"] for s in all_suppliers.data}

            processed_items = []
            for it in items:
                raw_name = getattr(it, 'supplier_name', "Fornecedor Genérico")
                if not raw_name: raw_name = "Fornecedor Genérico"
                    
                sup_key = raw_name.upper().strip()
                sup_id = supplier_map.get(sup_key)
                
                if not sup_id:
                    new_id = str(uuid4())
                    supabase.table("suppliers").insert({"supplier_id": new_id, "name": raw_name, "is_active": True}).execute()
                    supplier_map[sup_key] = new_id
                    sup_id = new_id
                
                it_data = it.model_dump() if hasattr(it, 'model_dump') else it
                processed_items.append({**it_data, "supplier_id": sup_id})

            processed_items.sort(key=lambda x: x["supplier_id"])
            created_count = 0
            
            for sup_id, group in groupby(processed_items, key=lambda x: x["supplier_id"]):
                group_list = list(group)
                
                order_res = supabase.table(self.table_header).insert({
                    "supplier_id": sup_id,
                    "user_id": user_id,
                    "user_name": user_name, # GRAVA O NOME AQUI
                    "status": "Aprovado",
                    "created_at": datetime.now().isoformat(),
                    "expected_delivery_date": str(group_list[0].get("expected_delivery_date")) if group_list[0].get("expected_delivery_date") else None
                }).execute()
                
                if order_res.data:
                    order_id = order_res.data[0]["order_id"]
                    items_payload = [{
                        "order_id": order_id,
                        "sku_id": i["sku_id"],
                        "quantity_ordered": i["quantity"],
                        "unit_cost": i["unit_cost"]
                    } for i in group_list]
                    
                    supabase.table(self.table_items).insert(items_payload).execute()
                    created_count += 1
            
            return {"success": True, "message": "Pedidos gerados!", "orders_created": created_count}
        except Exception as e:
            print(f"🔥 ERRO AO CRIAR LOTE: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))