import logging
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class DashboardRepository:
    def get_all_skus_with_analysis(self):
        """
        Busca todos os SKUs usando a mesma view da tabela de estoque (vw_analise_reposicao).
        Isso garante que o Dashboard e o Estoque mostrem valores idênticos.
        """
        try:
            response = (
                supabase.table("vw_analise_reposicao")
                .select("*")
                .execute()
            )
            return response.data or []
        except Exception:
            logger.exception("Erro ao buscar SKUs na view vw_analise_reposicao")
            return []

    def search_by_term(self, term: str):
        try:
            cleaned_term = term.strip()
            
            # 1. Busca por código (na view unificada)
            res_codigo = (
                supabase.table("vw_analise_reposicao")
                .select("*")
                .ilike("codigo", f"%{cleaned_term}%")
                .limit(15)
                .execute()
            )
                
            # 2. Busca por nome do produto (na view unificada)
            res_nome = (
                supabase.table("vw_analise_reposicao")
                .select("*")
                .ilike("nome_produto", f"%{cleaned_term}%")
                .limit(15)
                .execute()
            )

            # 3. Unir os resultados e remover duplicatas
            resultados = []
            ids_vistos = set()

            for item in (res_codigo.data or []) + (res_nome.data or []):
                if item["sku_id"] not in ids_vistos:
                    ids_vistos.add(item["sku_id"])
                    resultados.append(item)

            return resultados[:15]
        
        except Exception:
            logger.exception("Erro ao buscar SKUs por termo: %s", term)
            return []

    def get_history_by_sku(self, sku_id: int):
        try:
            return (
                supabase.table("tb_historico_vendas")
                .select("periodo_sequencia, quantidade, valor")
                .eq("sku_id", sku_id)
                .order("periodo_sequencia")
                .execute()
                .data
            ) or []
        except Exception:
            logger.exception("Erro ao buscar histórico do SKU - sku_id: %s", sku_id)
            return []
                
    def get_aggregate_history(self):
        try:
            response = (
                supabase.table("tb_historico_vendas")
                .select("periodo_sequencia, quantidade")
                .limit(50000)
                .execute()
            )

            rows = response.data or []
            if not rows:
                return []

            aggregated = {}
            for row in rows:
                seq = row.get("periodo_sequencia")
                qty = row.get("quantidade")

                if seq is None or qty is None:
                    continue

                try:
                    s = int(seq)
                    q = float(qty)
                    aggregated[s] = aggregated.get(s, 0) + q
                except ValueError:
                    continue

            result = [
                {"periodo_sequencia": seq, "total_quantidade": total}
                for seq, total in aggregated.items()
            ]

            result.sort(key=lambda x: x["periodo_sequencia"])
            return result[-24:]

        except Exception:
            logger.exception("Erro ao gerar histórico agregado")
            return []

    def get_active_branches(self):
        try:
            response = (
                supabase.table("branches")
                .select("branch_id, name")
                .eq("is_active", True)
                .execute()
            )
            return response.data or []
        except Exception:
            logger.exception("Erro ao buscar filiais ativas")
            return []

    def get_configuration(self, key: str):
        try:
            response = (
                supabase.table("tb_configuracoes")
                .select("valor")
                .eq("chave", key)
                .single()
                .execute()
            )
            return response.data
        except Exception:
            logger.exception("Erro ao buscar configuração - chave: %s", key)
            return None