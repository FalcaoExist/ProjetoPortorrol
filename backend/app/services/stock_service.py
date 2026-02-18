from typing import List, Optional

from app.core.supabase_client import supabase


class StockService:
    def get_stock_data(self, filial: Optional[str] = None) -> List[dict]:
        try:
            query = supabase.table("tb_analise_compra").select("*")
            if filial:
                query = query.eq("filial_id", filial)
            analise_data = query.limit(500).execute().data
            if not analise_data:
                return []

            sku_ids = [item['sku_id'] for item in analise_data if item.get('sku_id')]
            if not sku_ids:
                return []

            skus_res = supabase.table("tb_skus").select("id, codigo, nome_produto, classificacao").in_("id", sku_ids).execute()
            skus_map = {s['id']: s for s in skus_res.data}

            suppliers_res = supabase.table("product_suppliers").select("sku_id, suppliers(name)").in_("sku_id", sku_ids).execute()
            sku_supplier_map = {item['sku_id']: item['suppliers']['name'] for item in suppliers_res.data if item.get('suppliers')}

            result = []
            for row in analise_data:
                sid = row.get('sku_id')
                sku_info = skus_map.get(sid, {})
                est = row.get('estoque_soma', 0) or 0
                dem = row.get('demanda_soma', 0) or 1
                dias = int(est / (dem / 30)) if dem > 0 else 999

                result.append({
                    "id": sid,
                    "codigo": sku_info.get("codigo", "S/C"),
                    "item": sku_info.get("nome_produto", "Desconhecido"),
                    "categoria": sku_info.get("classificacao", "Geral"),
                    "unidades": est,
                    "fornecedor": sku_supplier_map.get(sid, "Sem Vínculo"),
                    "filial": row.get("filial_id", "Matriz"),
                    "dias_cobertura": dias,
                    "valor": 0.0
                })
            return result
        except Exception:
            return []
