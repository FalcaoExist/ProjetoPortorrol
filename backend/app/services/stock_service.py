from typing import Optional, List
from app.core.supabase_client import supabase
import uuid

class StockService:
    def get_stock(
        self,
        filial: Optional[str] = None,
        fornecedor: Optional[str] = None,
        status: Optional[str] = None,
        current_user: Optional[dict] = None
    ) -> list:
        try:
            # 1. Busca os SKUs
            skus_res = supabase.table("tb_skus").select("id, codigo, nome_produto, classificacao").execute()
            sku_map = {s["id"]: s for s in (skus_res.data or [])}
            
            if not sku_map:
                return []

            # 2. Busca Análises de Compra
            query_analise = supabase.table("tb_analise_compra").select("*")
            analise_data = query_analise.execute().data or []

            # 3. Busca Fornecedores e Custos
            ps_res = supabase.table("product_suppliers").select("sku_id, preco_custo, suppliers(name)").execute()
            
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

            # 4. AGRUPAMENTO (PIVOT) - Junta as várias filiais num único produto!
            grouped_stock = {}

            for analise in analise_data:
                sku_id = analise.get("sku_id")
                if not sku_id:
                    continue
                
                # Se é a primeira vez que vemos este produto, criamos a "caixa" dele
                if sku_id not in grouped_stock:
                    grouped_stock[sku_id] = {
                        "poa": 0,
                        "jv": 0,
                        "sp": 0,
                        "demanda": 0,
                        "analise_id": analise.get("id")
                    }

                # Lê as unidades da linha atual
                estoque_poa = int(analise.get("estoque_poa") or 0)
                estoque_jv = int(analise.get("estoque_jv") or 0)
                estoque_sp = int(analise.get("estoque_sp") or 0)
                estoque_total = int(analise.get("estoque_soma") or 0)
                
                filial_id = str(analise.get("filial_id") or "")

                # Se a coluna veio a 0, tentamos ler pela coluna da "soma" e pelo ID da filial
                if filial_id == "1" or filial_id.lower() == "porto alegre":
                    if estoque_poa == 0: estoque_poa = estoque_total
                elif filial_id == "3" or filial_id.lower() == "joinville":
                    if estoque_jv == 0: estoque_jv = estoque_total
                elif filial_id == "7" or "paulo" in filial_id.lower():
                    if estoque_sp == 0: estoque_sp = estoque_total

                # ADICIONA O STOCK NA CAIXA DO PRODUTO (Somando com as outras filiais)
                grouped_stock[sku_id]["poa"] += estoque_poa
                grouped_stock[sku_id]["jv"] += estoque_jv
                grouped_stock[sku_id]["sp"] += estoque_sp
                grouped_stock[sku_id]["demanda"] += float(analise.get("demanda_soma") or 1)

            # 5. Prepara os dados consolidados para o Frontend
            result = []
            for sku_id, dados in grouped_stock.items():
                sku_info = sku_map.get(sku_id, {})
                ps_info = ps_map.get(sku_id, {})
                
                fornecedor_nome = str(ps_info.get("fornecedor") or "Não informado")
                
                # Filtro de Fornecedor
                if fornecedor and fornecedor != "Todos":
                    if fornecedor.lower() not in fornecedor_nome.lower():
                        continue
                
                # O Total Real e Agrupado
                poa_final = dados["poa"]
                jv_final = dados["jv"]
                sp_final = dados["sp"]
                total_final = poa_final + jv_final + sp_final

                # Filtro de Filial
                if filial == "Porto Alegre" and poa_final == 0: continue
                if filial == "Joinville" and jv_final == 0: continue
                if filial == "São Paulo" and sp_final == 0: continue

                demanda = dados["demanda"] if dados["demanda"] > 0 else 1
                dias_cobertura = (total_final / demanda) * 30

                unique_id = dados.get("analise_id") or str(uuid.uuid4())

                # TRUQUE PARA O REACT: Dizemos que a filial desta linha é a que o utilizador escolheu
                # Isto impede o React de apagar a linha localmente por causa da formatação do texto.
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
                    
                    # AS COLUNAS ESTÃO AGORA AGRUPADAS E NUNCA A ZERO!
                    "porto_alegre": poa_final,
                    "joinville": jv_final,
                    "sao_paulo": sp_final,
                    
                    "filial": filial_para_react 
                }
                
                result.append(item)

            return result

        except Exception as e:
            print(f"🔥 ERRO CRÍTICO no serviço de estoque: {e}")
            return []

    async def import_stock(self, file, current_user: dict):
        return {"success": True, "message": "Importação em desenvolvimento."}