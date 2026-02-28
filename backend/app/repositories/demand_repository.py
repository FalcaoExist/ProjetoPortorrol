from app.core.supabase_client import supabase
from typing import List, Dict, Any
import logging

class DemandRepository:
   

    def get_all_sales_history(self) -> List[Dict[str, Any]]:
       
        try:
            response = supabase.table("tb_historico_vendas").select(
                "sku_id, periodo_sequencia, quantidade"
            ).execute()
            return response.data or []
        except Exception as e:
            logging.error(f"Erro ao buscar histórico de vendas: {e}")
            return []

    def upsert_monthly_demand(self, demand_data: List[Dict[str, Any]]):
       
        if not demand_data:
            return

        try:
            supabase.table("tb_demanda_mensal").upsert(demand_data).execute()
        except Exception as e:
            logging.error(f"Erro ao salvar demanda mensal: {e}")

demand_repository = DemandRepository()