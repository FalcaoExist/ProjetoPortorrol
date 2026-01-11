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

    # --- LÓGICA DE STATUS (REGRA DE NEGÓCIO) ---
    def _calcular_status(self, atendimento: float) -> StatusProduto:
        """
        Define o status do produto baseado na cobertura (atendimento %):
        > 120%      -> EXCESSO
        60% a 120%  -> OK
        30% a 59.9% -> SUBDIMENSIONADO
        < 30%       -> RUPTURA
        """
        if atendimento > 120.0:
            return StatusProduto.EXCESSO
        elif atendimento >= 60.0:
            return StatusProduto.OK
        elif atendimento >= 30.0:
            return StatusProduto.SUBDIMENSIONADO
        else:
            return StatusProduto.RUPTURA

    def _formatar_saida(self, raw_data: list):
        processed_data = []
        if not raw_data:
            return []

        for item in raw_data:
            if not item:
                continue
            
            # Extração segura dos dados de análise
            raw_analise = item.get("tb_analise_compra", [])
            analise_data = {}

            if isinstance(raw_analise, list):
                if len(raw_analise) > 0:
                    analise_data = raw_analise[0]
            elif isinstance(raw_analise, dict):
                analise_data = raw_analise
            
            atendimento = self._safe_float(analise_data.get("atendimento"), 0.0)
            status = self._calcular_status(atendimento)

            sku_obj = {
                "sku_id": item.get("id"),
                "codigo": item.get("codigo") or "N/A",
                "nome_produto": item.get("nome_produto") or "",
                "marca": item.get("marca") or "",
                "classificacao": item.get("classificacao") or "Geral",
                "atendimento": atendimento,
                "status": status,
                "sugestao_compra": self._safe_int(analise_data.get("sugestao_compra")),
                "estoque_soma": self._safe_int(analise_data.get("estoque_soma")),
                "demanda_soma": self._safe_float(analise_data.get("demanda_soma")),
                "filial_nome": str(analise_data.get("filial_id") or "")
            }
            processed_data.append(sku_obj)
        
        return processed_data

    # --- MÉTODOS PRINCIPAIS ---

    def get_skus_filtrados(self, filtro_status: str = None, filial: str = None, fornecedor: str = None):
        raw_data = self.repo.get_all_skus_with_analysis()
        todos_produtos = self._formatar_saida(raw_data)
        
        resultado = todos_produtos

        # 1. Filtro de Status
        if filtro_status:
            resultado = [p for p in resultado if p["status"].value == filtro_status.upper()]

        # 2. Filtro de Filial (Ignora se for vazio ou "Todas")
        if filial and filial.strip() and filial != "Todas":
            f_term = filial.lower().strip()
            resultado = [p for p in resultado if f_term in p["filial_nome"].lower()]

        # 3. Filtro de Fornecedor (Ignora se for vazio ou "Todos")
        if fornecedor and fornecedor.strip() and fornecedor != "Todos":
            s_term = fornecedor.lower().strip()
            resultado = [p for p in resultado if s_term in p["marca"].lower() or s_term in p["nome_produto"].lower()]
            
        return resultado

    def buscar_produtos(self, termo: str):
        if not termo:
            return []
        raw_data = self.repo.buscar_por_termo(termo)
        return self._formatar_saida(raw_data)

    def get_sku_history(self, sku_id: int = None):
        """
        Retorna o histórico de vendas.
        Se sku_id for fornecido, retorna histórico daquele produto.
        Se não, retorna o histórico agregado (soma total).
        Converte a sequência numérica (1..24) em rótulos de data (MM/YY).
        """
        if sku_id:
            data = self.repo.get_history_by_sku(sku_id)
            field = 'quantidade'
        else:
            # Busca soma geral (RPC get_sales_summary)
            data = self.repo.get_aggregate_history()
            field = 'total_quantidade'

        if not data:
            return []
        
        # Helper para calcular nome do mês
        # Lógica: Assume que o periodo_sequencia '24' é o mês atual.
        def get_date_label(seq):
            try:
                seq_int = int(seq)
                hoje = datetime.now()
                # Se 24 é hoje, então (24 - seq) é quantos meses atrás
                meses_atras = 24 - seq_int
                
                # Cálculo aproximado (30 dias por mês)
                data_alvo = hoje - timedelta(days=meses_atras * 30)
                return data_alvo.strftime("%m/%y") # Ex: 01/26
            except:
                return f"P{seq}"

        return [
            {
                "month": get_date_label(item.get('periodo_sequencia')), 
                "value": self._safe_int(item.get(field))
            } 
            for item in data
        ]

    def get_filiais(self):
        raw_branches = self.repo.get_active_branches()
        if not raw_branches:
            return []
        return [{"id": str(b["branch_id"]), "nome": b["name"]} for b in raw_branches]

    def update_lead_time(self, valor):
        return self.repo.update_configuracao("lead_time_padrao", valor)

    def update_orcamento(self, valor):
        return self.repo.update_configuracao("orcamento_mensal", valor)