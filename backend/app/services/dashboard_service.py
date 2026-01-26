from datetime import datetime, timedelta

from app.api.schemas import StatusProduto
from app.repositories.dashboard_repository import DashboardRepository


class DashboardService:
    def __init__(self):
        self.repo = DashboardRepository()

    # --- MÉTODOS AUXILIARES (SEGURANÇA) ---
    def _safe_float(self, val, default=0.0):
        try:
            if val is None:
                return default
            return float(val)
        except Exception:
            return default

    def _safe_int(self, val, default=0):
        try:
            if val is None:
                return default
            return int(float(val))
        except Exception:
            return default

    # --- LÓGICA DE STATUS (Baseada em DIAS DE COBERTURA) ---
    def _calculate_status(self, coverage_days: float) -> StatusProduto:
        """
        Define o status baseado nos Dias de Cobertura (Estoque / Demanda * 30):
        > 120 dias       -> EXCESSO
        60 a 120 dias    -> OK
        30 a 59.9 dias   -> SUBDIMENSIONADO
        < 30 dias        -> RUPTURA
        """
        if coverage_days > 120.0:
            return StatusProduto.EXCESSO
        elif coverage_days >= 60.0:
            return StatusProduto.OK
        elif coverage_days >= 30.0:
            return StatusProduto.SUBDIMENSIONADO
        else:
            return StatusProduto.RUPTURA

    def _format_output(self, raw_data: list):
        processed_data = []
        if not raw_data:
            return []

        for item in raw_data:
            if not item:
                continue

            raw_analysis = item.get("tb_analise_compra", [])
            analysis_data = {}

            if isinstance(raw_analysis, list):
                if len(raw_analysis) > 0:
                    analysis_data = raw_analysis[0]
            elif isinstance(raw_analysis, dict):
                analysis_data = raw_analysis

            stock = self._safe_int(analysis_data.get("estoque_soma"))
            demand = self._safe_float(analysis_data.get("demanda_soma"))

            coverage_days = 0.0
            if demand > 0:
                coverage_days = (stock / demand) * 30
            elif stock > 0:
                coverage_days = 999.0
            else:
                coverage_days = 0.0

            status = self._calculate_status(coverage_days)

            sku_obj = {
                "sku_id": item.get("id"),
                "codigo": item.get("codigo") or "N/A",
                "nome_produto": item.get("nome_produto") or "",
                "marca": item.get("marca") or "",
                "classificacao": item.get("classificacao") or "Geral",
                "atendimento": round(coverage_days, 1),
                "status": status,
                "sugestao_compra": self._safe_int(analysis_data.get("sugestao_compra")),
                "estoque_soma": stock,
                "demanda_soma": demand,
                "filial_nome": str(analysis_data.get("filial_id") or "")
            }
            processed_data.append(sku_obj)

        return processed_data

    # --- MÉTODOS PRINCIPAIS ---

    def get_filtered_skus(self, status_filter: str = None, branch: str = None, supplier: str = None):
        raw_data = self.repo.get_all_skus_with_analysis()
        all_products = self._format_output(raw_data)

        result = all_products

        if status_filter:
            result = [p for p in result if p["status"].value == status_filter.upper()]

        if branch and branch.strip() and branch != "Todas":
            b_term = branch.lower().strip()
            result = [p for p in result if b_term in p["filial_nome"].lower()]

        if supplier and supplier.strip() and supplier != "Todos":
            s_term = supplier.lower().strip()
            result = [p for p in result if s_term in p["marca"].lower() or s_term in p["nome_produto"].lower()]

        return result

    def search_products(self, term: str):
        if not term:
            return []
        raw_data = self.repo.search_by_term(term)
        return self._format_output(raw_data)

    def get_sku_history(self, sku_id: int = None):
        if sku_id:
            data = self.repo.get_history_by_sku(sku_id)
            field = 'quantidade'
        else:
            data = self.repo.get_aggregate_history()
            field = 'total_quantidade'

        if not data:
            return []
        
        def get_date_label(seq):
            try:
                seq_int = int(seq)
                today = datetime.now()
                months_back = 24 - seq_int
                target = today - timedelta(days=months_back * 30)
                return target.strftime("%m/%y")
            except:
                return f"P{seq}"

        return [
            {
                "month": get_date_label(item.get('periodo_sequencia')), 
                "value": self._safe_int(item.get(field))
            } 
            for item in data
        ]

    def get_branches(self):
        raw_branches = self.repo.get_active_branches()
        if not raw_branches:
            return []
        return [{"id": str(b["branch_id"]), "nome": b["name"]} for b in raw_branches]

    def update_lead_time(self, value):
        return self.repo.update_configuration("lead_time_padrao", value)

    def update_budget(self, value):
        return self.repo.update_configuration("orcamento_mensal", value)
    
def get_date_label(seq):
    try:
        seq_int = int(seq)
        hoje = datetime.now()
        # Se seq=24 (último), meses_atras=0. Se seq=1 (primeiro), meses_atras=23.
        meses_atras = 24 - seq_int 
        data_alvo = hoje - timedelta(days=meses_atras * 30)
        return data_alvo.strftime("%m/%y") 
    except:
        return f"P{seq}"