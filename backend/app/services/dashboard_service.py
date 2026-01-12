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
    def _calcular_status(self, dias_cobertura: float) -> StatusProduto:
        """
        Define o status baseado nos Dias de Cobertura (Estoque / Demanda * 30):
        > 120 dias       -> EXCESSO
        60 a 120 dias    -> OK
        30 a 59.9 dias   -> SUBDIMENSIONADO
        < 30 dias        -> RUPTURA
        """
        if dias_cobertura > 120.0:
            return StatusProduto.EXCESSO
        elif dias_cobertura >= 60.0:
            return StatusProduto.OK
        elif dias_cobertura >= 30.0:
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
            
            # 1. Extrair Estoque e Demanda
            estoque = self._safe_int(analise_data.get("estoque_soma"))
            demanda = self._safe_float(analise_data.get("demanda_soma"))
            
            # 2. Calcular Dias de Cobertura
            # Fórmula: (Estoque / Demanda) * 30
            dias_cobertura = 0.0
            
            if demanda > 0:
                dias_cobertura = (estoque / demanda) * 30
            elif estoque > 0:
                # Se tem estoque mas demanda é 0, a cobertura é "infinita" -> Excesso
                dias_cobertura = 999.0 
            else:
                # Sem estoque e sem demanda -> Consideramos Ruptura (0 dias)
                dias_cobertura = 0.0

            # 3. Definir Status baseado nos dias
            status = self._calcular_status(dias_cobertura)

            sku_obj = {
                "sku_id": item.get("id"),
                "codigo": item.get("codigo") or "N/A",
                "nome_produto": item.get("nome_produto") or "",
                "marca": item.get("marca") or "",
                "classificacao": item.get("classificacao") or "Geral",
                # Enviamos 'dias_cobertura' no campo 'atendimento' para o front mostrar "45 dias" e não "%"
                "atendimento": round(dias_cobertura, 1), 
                "status": status,
                "sugestao_compra": self._safe_int(analise_data.get("sugestao_compra")),
                "estoque_soma": estoque,
                "demanda_soma": demanda,
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
                hoje = datetime.now()
                meses_atras = 24 - seq_int
                data_alvo = hoje - timedelta(days=meses_atras * 30)
                return data_alvo.strftime("%m/%y") 
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