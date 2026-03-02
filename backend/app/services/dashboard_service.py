import unicodedata
from datetime import datetime, timedelta
from app.api.schemas import StatusProduto
from app.repositories.dashboard_repository import DashboardRepository

class DashboardService:
    def __init__(self):
        self.repo = DashboardRepository()

    def _normalize_text(self, text: str) -> str:
        if not text:
            return ""
        return unicodedata.normalize('NFKD', str(text)).encode('ASCII', 'ignore').decode('utf-8').lower().strip()

    def _safe_float(self, val, default=0.0):
        try: return float(val) if val is not None else default
        except Exception: return default

    def _safe_int(self, val, default=0):
        try: return int(float(val)) if val is not None else default
        except Exception: return default

    def _calculate_status(self, coverage_days: float) -> StatusProduto:
        if coverage_days > 100.0: return StatusProduto.EXCESSO
        elif coverage_days >= 60.0: return StatusProduto.OK
        elif coverage_days >= 30.0: return StatusProduto.SUBDIMENSIONADO
        else: return StatusProduto.RUPTURA

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
                "sugestao_compra": self._safe_int(item.get("quantidade_sugerida_compra")),
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
        raw_data = self.repo.get_filtered_skus(status=status_filter, branch=branch, supplier=supplier)
        return self._format_output(raw_data, branch)

    def search_products(self, term: str):
        if not term: return []
        raw_data = self.repo.get_filtered_skus(search=term, limit=15)
        return self._format_output(raw_data)

    def get_sku_history(self, sku_id: int = None):
        if sku_id:
            data = self.repo.get_history_by_sku(sku_id)
            field = 'quantidade'
        else:
            data = self.repo.get_aggregate_history()
            field = 'total_quantidade'

        if not data: return []
        
        def get_date_label(seq):
            try:
                target = datetime.now() - timedelta(days=(24 - int(seq)) * 30)
                return target.strftime("%m/%y")
            except: return f"P{seq}"

        return [{"month": get_date_label(item.get('periodo_sequencia')), "value": self._safe_int(item.get(field))} for item in data]

    def get_branches(self):
        raw = self.repo.get_active_branches()
        return [{"id": str(b["branch_id"]), "nome": b["name"]} for b in raw] if raw else []

    def update_lead_time(self, value): return self.repo.update_configuration("lead_time_padrao", value)
    def update_budget(self, value): return self.repo.update_configuration("orcamento_mensal", value)