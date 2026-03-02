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
        text = unicodedata.normalize('NFKD', str(text)).encode('ASCII', 'ignore').decode('utf-8')
        return text.lower().strip()

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

    def _calculate_status(self, coverage_days: float) -> StatusProduto:
        """
        Define o status baseado EXATAMENTE nos Dias de Cobertura oriundos da Tabela de Estoque:
        > 120 dias       -> EXCESSO
        60 a 120 dias    -> OK
        30 a 59.9 dias   -> SUBDIMENSIONADO
        < 30 dias        -> RUPTURA (Ruptura Iminente)
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

            # Extraindo dados diretamente da view de Estoque (vw_analise_reposicao)
            stock = self._safe_int(item.get("estoque_atual"))
            demand = self._safe_float(item.get("demanda_mensal_media"))
            
            # Puxa o 'dias_cobertura' REAL validado pela view de estoque
            coverage_days = self._safe_float(item.get("dias_cobertura"), default=0.0)
            if coverage_days < 0:
                coverage_days = 0.0

            status = self._calculate_status(coverage_days)

            fornecedor_nome = item.get("fornecedor") or ""

            sku_obj = {
                "sku_id": item.get("sku_id"),
                "codigo": item.get("codigo") or "N/A",
                "nome_produto": item.get("nome_produto") or "",
                "marca": item.get("marca") or fornecedor_nome,
                "classificacao": item.get("classificacao") or "Geral",
                "atendimento": round(coverage_days, 1),
                "status": status,
                "sugestao_compra": self._safe_int(item.get("quantidade_sugerida_compra")),
                "estoque_soma": stock,
                "demanda_soma": demand,
                "filial_nome": "Geral",
                "fornecedor_nome": fornecedor_nome,
                # Salva para aplicar a exata mesma lógica de filtro de filial do StockService
                "estoque_sp": self._safe_int(item.get("estoque_sp")),
                "estoque_jv": self._safe_int(item.get("estoque_jv")),
                "estoque_poa": self._safe_int(item.get("estoque_poa"))
            }
            processed_data.append(sku_obj)

        return processed_data

    def get_filtered_skus(self, status_filter: str = None, branch: str = None, supplier: str = None):
        raw_data = self.repo.get_all_skus_with_analysis()
        all_products = self._format_output(raw_data)

        result = []

        for p in all_products:
            # 1. Filtro de Status
            if status_filter and p["status"].value != status_filter.upper():
                continue

            # 2. Filtro de Filial (idêntico à página de Estoque)
            if branch and branch.strip() and branch != "Todas":
                b_term = self._normalize_text(branch)
                
                estoque_poa = p.get("estoque_poa", 0)
                estoque_jv = p.get("estoque_jv", 0)
                estoque_sp = p.get("estoque_sp", 0)

                # Verifica se tem estoque na filial selecionada
                if "alegre" in b_term and estoque_poa <= 0:
                    continue
                elif "joinville" in b_term and estoque_jv <= 0:
                    continue
                elif "paulo" in b_term and estoque_sp <= 0:
                    continue
                    
                p["filial_nome"] = branch

            # 3. Filtro de Fornecedor
            if supplier and supplier.strip() and supplier != "Todos":
                s_term = self._normalize_text(supplier)
                if s_term not in self._normalize_text(p.get("fornecedor_nome", "")) and \
                   s_term not in self._normalize_text(p.get("marca", "")):
                    continue

            result.append(p)

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