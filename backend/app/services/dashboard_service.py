from http.client import HTTPException
import logging
import unicodedata
from datetime import datetime, timedelta
from app.api.schemas import StatusProduto
from app.repositories.dashboard_repository import DashboardRepository

logger = logging.getLogger(__name__)

class DashboardService:
    def __init__(self):
        self.repo = DashboardRepository()

    def _normalize_text(self, text: str) -> str:
        if not text:
            return ""
        return unicodedata.normalize('NFKD', str(text)).encode('ASCII', 'ignore').decode('utf-8').lower().strip()

    def _safe_float(self, val, default=0.0):
        try:
            if val is None:
                return default
            return float(val)
        except (TypeError, ValueError):
            logger.debug("Falha ao converter valor para float: %s", val)
            return default

    def _safe_int(self, val, default=0):
        try:
            if val is None:
                return default
            return int(float(val))
        except (TypeError, ValueError):
            logger.debug("Falha ao converter valor para int: %s", val)
            return default

    def _calculate_status(self, coverage_days: float) -> StatusProduto:
        if coverage_days > 100.0: 
            return StatusProduto.EXCESSO
        elif coverage_days >= 60.0: 
            return StatusProduto.OK
        elif coverage_days >= 30.0: 
            return StatusProduto.SUBDIMENSIONADO
        else: 
            return StatusProduto.RUPTURA

    def _format_output(self, raw_data: list, branch_name: str = "Geral"):
        processed_data = []
        for item in raw_data or []:
            if not item: continue

            coverage_days = self._safe_float(item.get("dias_cobertura"))
            if coverage_days < 0: coverage_days = 0.0

            fornecedor_nome = item.get("fornecedor") or ""

            processed_data.append({
                "sku_id": item.get("sku_id"),
                "codigo": item.get("codigo") or "N/A",
                "nome_produto": item.get("nome_produto") or "",
                "marca": item.get("marca") or fornecedor_nome,
                "classificacao": item.get("classificacao") or "Geral",
                "atendimento": round(coverage_days, 1),
                "status": self._calculate_status(coverage_days),
                "sugestao_compra": self._safe_int(item.get("sugestao_compra")),
                "valor": self._safe_float(item.get("valor")), 
                "estoque_soma": self._safe_int(item.get("estoque_atual")),
                "demanda_soma": self._safe_float(item.get("demanda_mensal_media")),
                "filial_nome": branch_name if branch_name and branch_name != "Todas" else "Geral",
                "fornecedor_nome": fornecedor_nome,
                "estoque_sp": self._safe_int(item.get("estoque_sp")),
                "estoque_jv": self._safe_int(item.get("estoque_jv")),
                "estoque_poa": self._safe_int(item.get("estoque_poa"))
            })
        return processed_data

    def get_filtered_skus(self, status_filter: str = None, branch: str = None, supplier: str = None):
        try:
            # Versão otimizada: a filtragem agora ocorre no repositório (SQL) e não no Python
            raw_data = self.repo.get_filtered_skus(status=status_filter, branch=branch, supplier=supplier)
            return self._format_output(raw_data, branch)
        except Exception as e:
            logger.exception("Erro ao buscar SKUs filtrados para dashboard")
            raise

    def search_products(self, term: str):
        if not term: return []
        try:
            # Unificado para usar o método de filtragem otimizado com busca por termo
            raw_data = self.repo.get_filtered_skus(search=term, limit=15)
            return self._format_output(raw_data)
        except Exception as e:
            logger.exception("Erro ao buscar produtos pelo termo: %s", term)
            raise

    def get_sku_history(self, sku_id: int = None):
        try:
            if sku_id:
                data = self.repo.get_history_by_sku(sku_id)
                field = 'quantidade'
            else:
                data = self.repo.get_aggregate_history()
                field = 'total_quantidade'
        except Exception as e:
            logger.exception("Erro ao buscar histórico de SKU")
            raise

        if not data: return []
        
        def get_date_label(seq):
            try:
                target = datetime.now() - timedelta(days=(24 - int(seq)) * 30)
                return target.strftime("%m/%y")
            except (TypeError, ValueError):
                logger.debug("Erro ao calcular label de data para sequencia: %s", seq)
                return f"P{seq}"

        return [{"month": get_date_label(item.get('periodo_sequencia')), "value": self._safe_int(item.get(field))} for item in data]

    def get_branches(self):
        try:
            raw = self.repo.get_active_branches()
            return [{"id": str(b["branch_id"]), "nome": b["name"]} for b in raw] if raw else []
        except Exception:
            logger.exception("Erro ao buscar filiais ativas")
            raise

    def update_lead_time(self, value):
        try:
            return self.repo.update_configuration("lead_time_padrao", value)
        except Exception:
            logger.exception("Erro ao atualizar lead_time_padrao")
            raise

    def update_budget(self, value):
        try:
            return self.repo.update_configuration("orcamento_mensal", value)
        except Exception:
            logger.exception("Erro ao atualizar orcamento_mensal")
            raise
    
    def get_configuration(self, key: str):
        return self.repo.get_configuration(key)

    def get_budget_context(self, supplier_name: str = None):
        total = self.repo.get_total_active_budget()
        individual = total
        start = end = None
        
        if supplier_name and supplier_name != "Todos":
            data = self.repo.get_supplier_budget(supplier_name)
            if data:
                individual = self._safe_float(data.get('budget'))
                start = data.get('start')
                end = data.get('end')
        
        return {
            "valor_total": total,
            "valor_individual": individual,
            "start": start,
            "end": end
        }

    def get_supplier_status(self) -> list:
        try:
            return self.repo.get_supplier_status()
        except Exception as e:
            logger.exception(f"Erro ao buscar status dos fornecedores: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao buscar status dos fornecedores: {str(e)}")

    def get_supplier_status_by_name(self, supplier_name: str) -> list:
        try:
            suppliers = self.repo.get_supplier_status()
            result = next((supplier for supplier in suppliers if supplier.get("fornecedor") == supplier_name), None)
            return [result] if result else []
        except Exception as e:
            logger.exception(f"Erro ao buscar status do fornecedor por nome: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao buscar status do fornecedor por nome: {str(e)}")

    def get_critical_items(self, limit: int = 20, supplier: str = None):
        try:
            return self.repo.get_critical_skus(limit, supplier)
        except Exception as e:
            logger.exception(f"Erro ao buscar SKUs criticos: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao buscar SKUs criticos: {str(e)}")

    def get_excess_items(self, limit: int = 20, supplier: str = None):
        try:
            return self.repo.get_excess_skus(limit, supplier)
        except Exception as e:
            logger.exception(f"Erro ao buscar SKUs em excesso: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao buscar SKUs em excesso: {str(e)}")