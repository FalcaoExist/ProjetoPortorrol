import math
import logging
from typing import Optional, List
from app.repositories.stock_repository import StockRepository

logger = logging.getLogger(__name__)

class StockService:
    def __init__(self, stock_repository: Optional[StockRepository] = None):
        self.stock_repo = stock_repository or StockRepository()

    def get_stock(
        self,
        filial: Optional[str] = None,
        fornecedor: Optional[str] = None,
        status: Optional[str] = None,
        limit: Optional[int] = None,
        current_user: Optional[dict] = None,
        unidades_pendentes: Optional[int] = None,
    ) -> list:
        # Pega dados brutos da view via repositorio
        logger.info(
            "Buscando estoque - filial: %s - fornecedor: %s - limit: %s",
            filial, fornecedor, limit,
        )

        try:
            raw_data = self.stock_repo.get_stock_analysis(
                filial=filial,
                fornecedor=fornecedor,
                limit=limit,
                unidades_pendentes=unidades_pendentes,
            )
        except Exception:
            logger.exception(
                "Erro ao buscar análise de estoque - filial: %s - fornecedor: %s",
                filial,
                fornecedor,
            )
            raise
        if not raw_data:
            logger.info("Nenhum registro de estoque encontrado")
            return []
        
        filtered_data = []
        for item in raw_data:
            estoque_poa = item.get("estoque_poa") or 0
            estoque_jv = item.get("estoque_jv") or 0
            estoque_sp = item.get("estoque_sp") or 0

            if not filial or filial == "Todos":
                filtered_data.append(item)
            elif filial == "Porto Alegre" and float(estoque_poa) > 0:
                filtered_data.append(item)
            elif filial == "Joinville" and float(estoque_jv) > 0:
                filtered_data.append(item)
            elif (filial == "São Paulo" or "Paulo" in filial) and float(estoque_sp) > 0:
                filtered_data.append(item)

        result = []

        for item in raw_data:    
            try:      
                unique_id = str(item.get("sku_id"))
                
                def safe_float(val, default_to_zero=True):
                    if val is None:
                        return 0.0 if default_to_zero else None
                    try:
                        return float(val)
                    except (ValueError, TypeError):
                        return 0.0 if default_to_zero else None

                sugerida = safe_float(item.get("quantidade_sugerida_compra"))
                sugerida_projetada = safe_float(
                    item.get("quantidade_sugerida_compra_projetada", item.get("quantidade_sugerida_compra_v2"))
                )
                rop = safe_float(item.get("rop"))
                stock = safe_float(item.get("estoque_atual"))
                dias_cobertura = safe_float(item.get("dias_cobertura"), default_to_zero=False)
                unidades_pendentes = safe_float(item.get("unidades_pendentes"))
                estoque_projetado = safe_float(item.get("estoque_projetado"))
                dias_cobertura_projetado = safe_float(item.get("dias_cobertura_projetado"), default_to_zero=False)
                
                mapped_item = {
                    "id": unique_id,
                    "sku_id": item.get("sku_id"),
                    "codigo": item.get("codigo", "S/C"),
                    "item": item.get("nome_produto", "Item sem nome"),
                    "categoria": item.get("classificacao", "Geral"),
                    "unidades": int(stock),
                    "valor": 0, 
                    "fornecedor": item.get("fornecedor", "Não informado"),
                    "dias_cobertura": dias_cobertura if dias_cobertura is None else round(dias_cobertura, 2),
                    "porto_alegre": int(safe_float(item.get("estoque_poa"))),
                    "joinville": int(safe_float(item.get("estoque_jv"))),
                    "sao_paulo": int(safe_float(item.get("estoque_sp"))),
                    "filial": filial if (filial and filial != "Todos") else "Todos",
                    "rop": math.ceil(rop),
                    "qtd_sugerida": math.ceil(sugerida),
                    "leadtime": int(safe_float(item.get("leadtime_utilizado_dias"))),
                    "demanda_mensal": safe_float(item.get("demanda_mensal_media")),
                    "unidades_pendentes": int(unidades_pendentes),
                    "estoque_projetado": int(estoque_projetado),
                    "dias_cobertura_projetado": (
                        dias_cobertura_projetado if dias_cobertura_projetado is None else round(dias_cobertura_projetado, 2)
                    ),
                    "quantidade_sugerida_compra_projetada": math.ceil(sugerida_projetada)
                }
                result.append(mapped_item)

            except Exception:
                logger.exception(
                    "Erro ao processar item de estoque - sku_id: %s",
                    item.get("sku_id") if isinstance(item, dict) else "unknown",
                )
                continue
    
        return result