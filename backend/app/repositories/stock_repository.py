import logging
from typing import Optional, List, Dict, Any
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class StockRepository:
    def get_stock_analysis(self, filial: Optional[str] = None, fornecedor: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            query = supabase.table("vw_analise_reposicao").select("*")

            if fornecedor and fornecedor != "Todos":
                query = query.ilike("fornecedor", f"%{fornecedor}%")

            response = query.execute()
            data = response.data or []

        response = query.execute()
        return response.data or []