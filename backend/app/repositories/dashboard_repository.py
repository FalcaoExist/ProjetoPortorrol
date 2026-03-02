from app.core.supabase_client import supabase

class DashboardRepository:
    def get_all_skus_with_analysis(self):
        """
        Busca todos os SKUs usando a mesma view da tabela de estoque (vw_analise_reposicao).
        Isso garante que o Dashboard e o Estoque mostrem valores idênticos.
        """
        response = supabase.table("vw_analise_reposicao").select("*").execute()
        return response.data

    def search_by_term(self, term: str):
        cleaned_term = term.strip()
        
        # 1. Busca por código (na view unificada)
        res_codigo = supabase.table("vw_analise_reposicao")\
            .select("*")\
            .ilike("codigo", f"%{cleaned_term}%")\
            .limit(15)\
            .execute()
            
        # 2. Busca por nome do produto (na view unificada)
        res_nome = supabase.table("vw_analise_reposicao")\
            .select("*")\
            .ilike("nome_produto", f"%{cleaned_term}%")\
            .limit(15)\
            .execute()

        # 3. Unir os resultados e remover duplicatas
        resultados = []
        ids_vistos = set()
        
        for item in (res_codigo.data + res_nome.data):
            if item["sku_id"] not in ids_vistos:
                ids_vistos.add(item["sku_id"])
                resultados.append(item)
                
        return resultados[:15]

    def get_history_by_sku(self, sku_id: int):
        return supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade, valor")\
                .eq("sku_id", sku_id)\
                .order("periodo_sequencia")\
                .execute().data
                
    def get_aggregate_history(self):
        response = supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade")\
                .limit(50000)\
                .execute()

        rows = response.data
        if not rows:
            return []

        aggregated = {}
        for row in rows:
            seq = row.get('periodo_sequencia')
            qty = row.get('quantidade')

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

        result.sort(key=lambda x: x['periodo_sequencia'])
        return result[-24:]

    def get_active_branches(self):
        response = supabase.table("branches").select("branch_id, name").eq("is_active", True).execute()
        return response.data

    def get_configuration(self, key: str):
        response = supabase.table("tb_configuracoes").select("valor").eq("chave", key).single().execute()
        return response.data

    def update_configuration(self, key: str, value: str):
        return supabase.table("tb_configuracoes")\
                .update({"valor": value, "updated_at": "now()"})\
                .eq("chave", key)\
                .execute()