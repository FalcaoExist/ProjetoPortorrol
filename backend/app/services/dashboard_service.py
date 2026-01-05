from app.repositories.dashboard_repository import DashboardRepository
from app.api.schemas import StatusProduto 

class DashboardService:
    def __init__(self):
        self.repo = DashboardRepository()

    def _calcular_status(self, atendimento: float) -> StatusProduto:
        """Calcula o status do produto baseado no atendimento (%)"""
        if atendimento < 50.0:
            return StatusProduto.RUPTURA
        elif atendimento > 100.0:
            return StatusProduto.EXCESSO
        else:
            return StatusProduto.OK

    def _formatar_saida(self, raw_data: list):
        """Formata a saída dos SKUs com análise de compra"""
        processed_data = []

        for item in raw_data:

            raw_analise = item.get("tb_analise_compra", [])
            analise_data = {}

            if isinstance(raw_analise, list):
                if len(raw_analise) > 0:
                    analise_data = raw_analise[0]
            elif isinstance(raw_analise, dict):
                analise_data = raw_analise
            
            # Extração segura de valores
            val_atendimento = analise_data.get("atendimento")
            if val_atendimento is None: val_atendimento = 0.0
            
            atendimento = float(val_atendimento)
            status = self._calcular_status(atendimento)

            # Montagem do Objeto
            sku_obj = {
                "sku_id": item["id"],
                "codigo": item["codigo"],
                "nome_produto": item["nome_produto"],
                "marca": item["marca"],
                "classificacao": item["classificacao"],
                "atendimento": atendimento,
                "status": status,
                "sugestao_compra": analise_data.get("sugestao_compra") or 0,
                "estoque_soma": analise_data.get("estoque_soma") or 0,
                "demanda_soma": float(analise_data.get("demanda_soma") or 0.0)
            }
            processed_data.append(sku_obj)
        
        return processed_data

    def get_skus_filtrados(self, filtro_status: str = None, filial: str = None):
        """Lista todos os SKUs e aplica filtro de Status se necessário"""
        # 1. Busca tudo do repositório
        raw_data = self.repo.get_all_skus_with_analysis()
        
        # 2. Formata usando o método auxiliar
        todos_produtos = self._formatar_saida(raw_data)
        
        # 3. Aplica filtro de memória (Status)
        if not filtro_status:
            return todos_produtos
            
        return [p for p in todos_produtos if p["status"].value == filtro_status.upper()]

    def buscar_produtos(self, termo: str):
        """
        NOVO: Busca SKUs por termo (Nome, Código ou ID).
        """
        if not termo:
            return []
            
        raw_data = self.repo.buscar_por_termo(termo)
        

        return self._formatar_saida(raw_data)

    def update_lead_time(self, dias: str):
        return self.repo.update_configuracao("lead_time_global", dias)

    def update_orcamento(self, valor: str):
        return self.repo.update_configuracao("orcamento_disponivel", valor)
    
    def get_filiais(self):
        return self.repo.get_filiais_disponiveis()  