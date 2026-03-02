import logging
from app.core.supabase_client import supabase
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class DemandRepository:
   
    def get_all_sales_history(self) -> List[Dict[str, Any]]:
        try:
            response = (
                supabase.table("tb_historico_vendas")
                .select("sku_id, periodo_sequencia, quantidade")
                .execute()
            )
            return response.data or []
        except Exception:
            logger.exception("Erro ao buscar histórico de vendas (tb_historico_vendas)")
            return []

    def upsert_monthly_demand(self, demand_data: List[Dict[str, Any]]):
        if not demand_data:
            return

        try:
            supabase.table("tb_demanda_mensal").upsert(demand_data).execute()

            logger.info(
                "Demanda mensal atualizada com sucesso - registros: %s",
                len(demand_data),
            )

        except Exception:
            logger.exception(
                "Erro ao salvar demanda mensal - registros: %s",
                len(demand_data),
            )
            raise

demand_repository = DemandRepository()