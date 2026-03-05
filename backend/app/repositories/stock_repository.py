from typing import Optional, List, Dict, Any
from app.core.supabase_client import supabase

class StockRepository:
    def get_stock_analysis(self, filial: Optional[str] = None, fornecedor: Optional[str] = None) -> List[Dict[str, Any]]:
        query = supabase.table("vw_analise_reposicao").select("*")

        if fornecedor and fornecedor != "Todos":
            query = query.ilike("fornecedor", f"%{fornecedor}%")

        response = query.execute()
        return response.data or []