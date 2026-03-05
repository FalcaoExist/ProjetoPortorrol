import logging
import unicodedata
from typing import List, Any, Dict
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.api.schemas import StatusProduto
from app.repositories.dashboard_repository import DashboardRepository

logger = logging.getLogger(__name__)

class DashboardService:
    def __init__(self, repository: DashboardRepository = None):
        self.repo = repository or DashboardRepository()
        self.THRESHOLD_EXCESSO = 100.0
        self.THRESHOLD_OK = 60.0
        self.THRESHOLD_SUB = 30.0

    def _normalize_text(self, text: str) -> str:
        if not text: return ""
        return unicodedata.normalize('NFKD', str(text)).encode('ASCII', 'ignore').decode('utf-8').lower().strip()

    def _safe_float(self, val, default=0.0):
        try:
            if val is None:
                return default
            return float(val)
        except (TypeError, ValueError) as e:
            logger.debug("Falha ao converter valor para float: %s", val)
            return default

    def _safe_int(self, val, default=0):
        try:
            if val is None:
                return default
            return int(float(val))
        except (TypeError, ValueError) as e:
            logger.debug("Falha ao converter valor para int: %s", val)
            return default

    def _calculate_status(self, coverage_days: float) -> StatusProduto:
        if coverage_days <= 30: 
            return StatusProduto.RUPTURA
        if coverage_days <= 60: 
            return StatusProduto.SUBDIMENSIONADO
        if coverage_days <= 100: 
            return StatusProduto.OK
        return StatusProduto.EXCESSO

    def _format_output(self, raw_data: list, branch_name: str = "Geral"):
        processed_data = []
        
        display_branch = branch_name if branch_name and branch_name.strip() != "" else "Todas"
        
        for item in (raw_data or []):
            if not item: continue
            
            coverage = max(0.0, self._safe_float(item.get("dias_cobertura")))
            fornecedor = item.get("fornecedor") or ""

            processed_data.append({
                "sku_id": item.get("sku_id"),
                "codigo": item.get("codigo") or "N/A",
                "nome_produto": item.get("nome_produto") or "",
                "marca": item.get("marca") or fornecedor,
                "classificacao": item.get("classificacao") or "Geral",
                "atendimento": round(coverage, 1),
                "status": self._calculate_status(coverage),
                "sugestao_compra": self._safe_int(item.get("sugestao_compra")),
                "valor": self._safe_float(item.get("valor")), 
                "estoque_soma": self._safe_int(item.get("estoque_atual")),
                "demanda_soma": self._safe_float(item.get("demanda_mensal_media")),
                "filial_nome": display_branch,
                "fornecedor_nome": fornecedor,
                "estoque_sp": self._safe_int(item.get("estoque_sp")),
                "estoque_jv": self._safe_int(item.get("estoque_jv")),
                "estoque_poa": self._safe_int(item.get("estoque_poa"))
            })
        return processed_data

    def get_filtered_skus(self, status_filter: str = None, branch: str = None, supplier: str = None):
        try:
            raw = self.repo.get_filtered_skus(status=status_filter, branch=branch, supplier=supplier)
            return self._format_output(raw, branch)
        except Exception:
            logger.exception("Erro ao buscar SKUs filtrados")
            raise

    def search_products(self, term: str):
        if not term: return []
        try:
            raw = self.repo.get_filtered_skus(search=term, limit=15)
            return self._format_output(raw)
        except Exception:
            logger.exception(f"Erro ao buscar produtos: {term}")
            raise

    def get_sku_history(self, sku_id: int = None):
        try:
            if sku_id:
                data = self.repo.get_history_by_sku(sku_id)
                field = 'quantidade'
            else:
                rows = self.repo.get_aggregate_history()
                if not rows: return []
                
                aggregated = {}
                for row in rows:
                    seq, qty = row.get("periodo_sequencia"), row.get("quantidade")
                    if seq is not None and qty is not None:
                        try: aggregated[int(seq)] = aggregated.get(int(seq), 0) + float(qty)
                        except: continue

                data = sorted([{"periodo_sequencia": s, "total_quantidade": q} for s, q in aggregated.items()], 
                              key=lambda x: x["periodo_sequencia"])[-24:]
                field = 'total_quantidade'
            
            return [{"month": self._get_date_label(item.get('periodo_sequencia')), 
                     "value": self._safe_int(item.get(field))} for item in data]
        except Exception:
            logger.exception("Erro ao buscar histórico")
            raise

    def _get_date_label(self, seq):
        try:
            target = datetime.now() - timedelta(days=(24 - int(seq)) * 30)
            return target.strftime("%m/%y")
        except: return f"P{seq}"

    def get_branches(self):
        try:
            raw = self.repo.get_active_branches()
            return [{"id": str(b["branch_id"]), "nome": b["name"]} for b in (raw or [])]
        except Exception:
            logger.exception("Erro ao buscar filiais")
            raise

    def update_lead_time(self, value):
        try:
            return self.repo.update_configuration("lead_time_padrao", value)
        except Exception as e:
            logger.exception("Erro ao atualizar lead_time_padrao")
            raise

    def update_budget(self, value):
        return self.repo.update_configuration("orcamento_mensal", value)
    
    def get_configuration(self, key: str):
        return self.repo.get_configuration(key)

    def get_budget_context(self, supplier_name: str = None):
        total = self.repo.get_total_active_budget()
        context = {"valor_total": total, "valor_individual": total, "start": None, "end": None}
        
        if supplier_name and supplier_name != "Todos":
            data = self.repo.get_supplier_budget(supplier_name)
            if data:
                context.update({
                    "valor_individual": self._safe_float(data.get('budget')),
                    "start": data.get('start'), "end": data.get('end')
                })
        return context


    def get_supplier_status(self) -> list:
        try: return self.repo.get_supplier_status()
        except Exception as e:
            logger.exception("Erro no status do fornecedor")
            raise HTTPException(status_code=500, detail=str(e))

    def get_supplier_status_by_name(self, supplier_name: str) -> list:
        suppliers = self.get_supplier_status()
        result = next((s for s in suppliers if s.get("fornecedor") == supplier_name), None)
        return [result] if result else []

    def get_critical_items(self, limit: int = 20, supplier: str = None):
        try: return self.repo.get_critical_skus(limit, supplier)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_excess_items(self, limit: int = 20, supplier: str = None):
        try: return self.repo.get_excess_skus(limit, supplier)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
