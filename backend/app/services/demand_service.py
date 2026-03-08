import logging
from app.repositories.demand_repository import demand_repository
from typing import List, Dict, Any
from datetime import datetime, timezone
from collections import defaultdict

logger = logging.getLogger(__name__)

class DemandService:

    def calculate_and_save_all_monthly_demands(self):

        logger.info("Iniciando cálculo de demanda mensal para todos os SKUs")

        try:
            sales_history = demand_repository.get_all_sales_history()
        except Exception as e:
            logger.exception("Erro ao buscar histórico de vendas para cálculo de demanda")
            raise

        try:
            calculated_demands = self._process_demand_calculation(sales_history)
        except Exception as e:
            logger.exception("Erro ao processar cálculo de demanda")
            raise

        if calculated_demands:
            try:
                demand_repository.upsert_monthly_demand(calculated_demands)
                logger.info("Demandas mensais atualizadas com sucesso - total SKUs: %d", len(calculated_demands))
            except Exception as e:
                logger.exception("Erro ao salvar demandas mensais no banco")
                raise
        else:
            logger.info("Nenhuma demanda calculada para salvar")

    def _process_demand_calculation(self, sales_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        
        sales_by_sku = defaultdict(list)

        for record in sales_data:
            sku_id = record.get("sku_id")
            if not sku_id:
                logger.debug("Registro de venda sem sku_id ignorado: %s", record)
                continue
            sales_by_sku[sku_id].append(record)

        final_demand_data = []
        now_utc = datetime.now(timezone.utc).isoformat()

        for sku_id, records in sales_by_sku.items():
            monthly_quantities = [0] * 24
            for record in records:
                seq = record.get("periodo_sequencia")
                qty = record.get("quantidade", 0)
                if isinstance(seq, int) and 1 <= seq <= 24:
                    monthly_quantities[seq - 1] = qty
            
            average_demand = sum(monthly_quantities) / 24
            
            final_demand_data.append({
                "sku_id": sku_id,
                "demanda_media_mensal": average_demand,
                "ultima_atualizacao": now_utc,
            })
            
        return final_demand_data

demand_service = DemandService()