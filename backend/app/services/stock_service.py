from typing import Optional, List
from app.repositories.stock_repository import StockRepository
import uuid
import math

class StockService:
    def __init__(self, stock_repository: Optional[StockRepository] = None):
        self.stock_repo = stock_repository or StockRepository()

    def get_stock(
        self,
        filial: Optional[str] = None,
        fornecedor: Optional[str] = None,
        status: Optional[str] = None,
        current_user: Optional[dict] = None
    ) -> list:
        # Pega dados brutos da view via repositorio
        raw_data = self.stock_repo.get_stock_analysis(filial=filial, fornecedor=fornecedor)
        
        result = []
        for item in raw_data:            
            # Mapeamento dos campos da view para o formato esperado pelo frontend (ou adaptado)
            # A view retorna: sku_id, codigo, nome_produto, fornecedor, classificacao,
            # estoque_sp, estoque_jv, estoque_poa, estoque_atual, demanda_mensal_media,
            # demanda_diaria, dias_cobertura, leadtime_utilizado_dias, rop, quantidade_sugerida_compra
            
            # Gera ID único para o front (se necessario) ou usa sku_id
            unique_id = str(item.get("sku_id"))
            
            # Tratamento de valores nulos
            def safe_float(val, default_to_zero=True):
                if val is None:
                    return 0.0 if default_to_zero else None
                try:
                    return float(val)
                except (ValueError, TypeError):
                    return 0.0 if default_to_zero else None

            sugerida = safe_float(item.get("quantidade_sugerida_compra"))
            rop = safe_float(item.get("rop"))
            stock = safe_float(item.get("estoque_atual"))
            
            # dias_cobertura deve ser None se for null no banco
            dias_cobertura = safe_float(item.get("dias_cobertura"), default_to_zero=False)
            
            mapped_item = {
                "id": unique_id,
                "sku_id": item.get("sku_id"),
                "codigo": item.get("codigo", "S/C"),
                "item": item.get("nome_produto", "Item sem nome"),
                "categoria": item.get("classificacao", "Geral"),
                "unidades": int(stock),
                "valor": 0, # A view não traz preço
                "fornecedor": item.get("fornecedor", "Não informado"),
                "dias_cobertura": dias_cobertura if dias_cobertura is None else round(dias_cobertura, 2),
                "porto_alegre": int(safe_float(item.get("estoque_poa"))),
                "joinville": int(safe_float(item.get("estoque_jv"))),
                "sao_paulo": int(safe_float(item.get("estoque_sp"))),
                "filial": filial if (filial and filial != "Todos") else "Todos",
                "rop": math.ceil(rop),
                "qtd_sugerida": math.ceil(sugerida),
                "leadtime": int(safe_float(item.get("leadtime_utilizado_dias"))),
                # Campos adicionais uteis
                "demanda_mensal": safe_float(item.get("demanda_mensal_media"))
            }
            
            result.append(mapped_item)
            
        return result

