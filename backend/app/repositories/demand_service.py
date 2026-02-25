from app.repositories.demand_repository import demand_repository
from typing import List, Dict, Any
from datetime import datetime, timezone
from collections import defaultdict

class DemandService:
    

    def calculate_and_save_all_monthly_demands(self):
        
        sales_history = demand_repository.get_all_sales_history()
        
        calculated_demands = self._process_demand_calculation(sales_history)
        
        if calculated_demands:
            demand_repository.upsert_monthly_demand(calculated_demands)

    def _process_demand_calculation(self, sales_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        
        sales_by_sku = defaultdict(list)
        for record in sales_data:
            sales_by_sku[record["sku_id"]].append(record)

        final_demand_data = []
        now_utc = datetime.now(timezone.utc).isoformat()

        for sku_id, records in sales_by_sku.items():
            monthly_quantities = [0] * 24
            for record in records:
                seq = record.get("periodo_sequencia")
                qty = record.get("quantidade", 0)
                if seq is not None and 1 <= seq <= 24:
                    monthly_quantities[seq - 1] = qty
            
            average_demand = sum(monthly_quantities) / 24
            
            final_demand_data.append({
                "sku_id": sku_id,
                "demanda_media_mensal": average_demand,
                "ultima_atualizacao": now_utc,
            })
            
        return final_demand_data

demand_service = DemandService()