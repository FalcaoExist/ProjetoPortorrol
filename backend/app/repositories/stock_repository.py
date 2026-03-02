from typing import Optional, List, Dict, Any
from app.core.supabase_client import supabase

class StockRepository:
    def get_stock_analysis(self, filial: Optional[str] = None, fornecedor: Optional[str] = None) -> List[Dict[str, Any]]:
        query = supabase.table("vw_analise_reposicao").select("*")

        if fornecedor and fornecedor != "Todos":
            query = query.ilike("fornecedor", f"%{fornecedor}%")

        response = query.execute()
        data = response.data or []

        if not filial or filial == "Todos":
            return data

        filtered_data = []
        for item in data:
            estoque_poa = item.get("estoque_poa") or 0
            estoque_jv = item.get("estoque_jv") or 0
            estoque_sp = item.get("estoque_sp") or 0

            if filial == "Porto Alegre" and estoque_poa > 0:
                filtered_data.append(item)
            elif filial == "Joinville" and estoque_jv > 0:
                filtered_data.append(item)
            elif (filial == "São Paulo" or "Paulo" in filial) and estoque_sp > 0:
                filtered_data.append(item)

        return filtered_data
