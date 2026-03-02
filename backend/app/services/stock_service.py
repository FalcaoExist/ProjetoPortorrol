from typing import Optional
import uuid
from app.repositories.stock_repository import StockRepository

class StockService:
    
    def __init__(self):
        self.repository = StockRepository()
    
    def get_stock(
        self,
        filial: Optional[str] = None,
        fornecedor: Optional[str] = None,
        status: Optional[str] = None,
        current_user: Optional[dict] = None
    ) -> list:
        try:
            skus_res = self.repository.get_skus()
            sku_map = {s["id"]: s for s in (skus_res.data or [])}
            
            if not sku_map:
                return []

            analise_res = self.repository.get_analise_compra()
            analise_data = analise_res.data or []

            ps_res = self.repository.get_product_suppliers()
            
            ps_map = {}
            for ps in (ps_res.data or []):
                sku_id = ps.get("sku_id")
                supplier_rel = ps.get("suppliers") or {}
                
                if isinstance(supplier_rel, dict):
                    supplier_name = supplier_rel.get("name", "")
                elif isinstance(supplier_rel, list) and len(supplier_rel) > 0:
                    supplier_name = supplier_rel[0].get("name", "")
                else:
                    supplier_name = ""
                    
                ps_map[sku_id] = {
                    "preco_custo": ps.get("preco_custo", 0),
                    "fornecedor": supplier_name
                }

            grouped_stock = {}

            for analise in analise_data:
                sku_id = analise.get("sku_id")
                if not sku_id:
                    continue
                
                if sku_id not in grouped_stock:
                    grouped_stock[sku_id] = {
                        "poa": 0,
                        "jv": 0,
                        "sp": 0,
                        "demanda": 0,
                        "analise_id": analise.get("id")
                    }

                estoque_poa = int(analise.get("estoque_poa") or 0)
                estoque_jv = int(analise.get("estoque_jv") or 0)
                estoque_sp = int(analise.get("estoque_sp") or 0)
                estoque_total = int(analise.get("estoque_soma") or 0)
                
                filial_id = str(analise.get("filial_id") or "")

                if filial_id == "1" or filial_id.lower() == "porto alegre":
                    if estoque_poa == 0: estoque_poa = estoque_total
                elif filial_id == "3" or filial_id.lower() == "joinville":
                    if estoque_jv == 0: estoque_jv = estoque_total
                elif filial_id == "7" or "paulo" in filial_id.lower():
                    if estoque_sp == 0: estoque_sp = estoque_total

                grouped_stock[sku_id]["poa"] += estoque_poa
                grouped_stock[sku_id]["jv"] += estoque_jv
                grouped_stock[sku_id]["sp"] += estoque_sp
                grouped_stock[sku_id]["demanda"] += float(analise.get("demanda_soma") or 1)

            result = []
            for sku_id, dados in grouped_stock.items():
                sku_info = sku_map.get(sku_id, {})
                ps_info = ps_map.get(sku_id, {})
                
                fornecedor_nome = str(ps_info.get("fornecedor") or "Não informado")
                
                if fornecedor and fornecedor != "Todos":
                    if fornecedor.lower() not in fornecedor_nome.lower():
                        continue
                
                poa_final = dados["poa"]
                jv_final = dados["jv"]
                sp_final = dados["sp"]
                total_final = poa_final + jv_final + sp_final

                if filial == "Porto Alegre" and poa_final == 0: continue
                if filial == "Joinville" and jv_final == 0: continue
                if filial == "São Paulo" and sp_final == 0: continue

                demanda = dados["demanda"] if dados["demanda"] > 0 else 1
                dias_cobertura = (total_final / demanda) * 30

                unique_id = dados.get("analise_id") or str(uuid.uuid4())

                filial_para_react = filial if (filial and filial != "Todos") else "Todos"

                item = {
                    "id": unique_id, 
                    "sku_id": sku_id, 
                    "codigo": sku_info.get("codigo", "S/C"),
                    "item": sku_info.get("nome_produto", "Item sem nome"),
                    "categoria": sku_info.get("classificacao", "Geral"),
                    "unidades": total_final,
                    "valor": float(ps_info.get("preco_custo") or 0),
                    "fornecedor": fornecedor_nome,
                    "dias_cobertura": round(dias_cobertura),
                    "porto_alegre": poa_final,
                    "joinville": jv_final,
                    "sao_paulo": sp_final,
                    "filial": filial_para_react 
                }
                
                result.append(item)

            return result

        except Exception as e:
            return []
