from app.core.supabase_client import supabase


class DashboardRepository:
    def get_all_skus_with_analysis(self):
        """
        Busca todos os SKUs, incluindo os dados de análise de compra (estoque/demanda)
        e o relacionamento com os fornecedores.
        """
            # Realiza o join entre tb_skus, tb_analise_compra e a estrutura de fornecedores
        response = supabase.table("tb_skus").select(
                "id, codigo, nome_produto, marca, classificacao, filial, "
                "tb_analise_compra(*), "
                "product_suppliers(suppliers(name))"
            ).execute()
        return response.data


    def search_by_term(self, term: str):
        cleaned_term = term.strip()
        
        # 1. Busca por código
        res_codigo = supabase.table("tb_skus")\
            .select("id, codigo, nome_produto, marca, tb_analise_compra(*)")\
            .ilike("codigo", f"%{cleaned_term}%")\
            .limit(15)\
            .execute()
            
        # 2. Busca por nome do produto
        res_nome = supabase.table("tb_skus")\
            .select("id, codigo, nome_produto, marca, tb_analise_compra(*)")\
            .ilike("nome_produto", f"%{cleaned_term}%")\
            .limit(15)\
            .execute()

        # 3. Unir os resultados e remover duplicatas (baseado no ID do SKU)
        resultados = []
        ids_vistos = set()
        
        # Junta as duas listas de resultados
        for item in (res_codigo.data + res_nome.data):
            if item["id"] not in ids_vistos:
                ids_vistos.add(item["id"])
                resultados.append(item)
                
        # Retorna no máximo 15 resultados (para não poluir o dropdown)
        return resultados[:15]

    def get_history_by_sku(self, sku_id: int):
        """
        Retorna o histórico de vendas real de um SKU específico ordenado por período.
        """
        return supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade, valor")\
                .eq("sku_id", sku_id)\
                .order("periodo_sequencia")\
                .execute().data
                
    def get_aggregate_history(self):
        """
        Calcula o total de vendas de todos os SKUs agregados por período
        para exibição no gráfico geral do dashboard.
        """
            # Recupera os dados de vendas para processamento em memória
        response = supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade")\
                .limit(50000)\
                .execute()

        rows = response.data
        if not rows:
            return []

            # Agregação manual para garantir a soma correta por sequência
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

            # Formata os dados para o padrão esperado pelo serviço
            result = [
                {"periodo_sequencia": seq, "total_quantidade": total}
                for seq, total in aggregated.items()
            ]

            # Ordena e retorna apenas os últimos 24 meses
            result.sort(key=lambda x: x['periodo_sequencia'])
            return result[-24:]



    def get_active_branches(self):
        """
        Retorna a lista de filiais ativas.
        """
        response = supabase.table("branches").select("branch_id, name").eq("is_active", True).execute()
        return response.data


    def get_configuration(self, key: str):
        """
        Recupera um valor de configuração global do sistema.
        """
        response = supabase.table("tb_configuracoes").select("valor").eq("chave", key).single().execute()
        return response.data


    def update_configuration(self, key: str, value: str):
        """
        Atualiza um parâmetro de configuração na tabela tb_configuracoes.
        """
        return supabase.table("tb_configuracoes")\
                .update({"valor": value, "updated_at": "now()"})\
                .eq("chave", key)\
                .execute()

        