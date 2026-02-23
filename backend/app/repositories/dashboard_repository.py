from app.core.supabase_client import supabase


class DashboardRepository:
    def get_all_skus_with_analysis(self):
        """
        Busca todos os SKUs, incluindo os dados de análise de compra (estoque/demanda)
        e o relacionamento com os fornecedores.
        """
        try:
            # Realiza o join entre tb_skus, tb_analise_compra e a estrutura de fornecedores
            response = supabase.table("tb_skus").select(
                "id, codigo, nome_produto, marca, classificacao, filial, "
                "tb_analise_compra(*), "
                "product_suppliers(suppliers(name))"
            ).execute()
            return response.data
        except Exception as e:
            print(f"!!! ERRO LISTAGEM GERAL !!!: {e}")
            return []

    def search_by_term(self, term: str):
        try:
            cleaned_term = term.strip()
            # Busca trazendo os dados de análise vinculados
            response = supabase.table("tb_skus")\
                .select("id, codigo, nome_produto, marca, tb_analise_compra(*)")\
                .or_(f"codigo.ilike.%{cleaned_term}%,nome_produto.ilike.%{cleaned_term}%")\
                .limit(15)\
                .execute()

            return response.data
        except Exception as e:
            print(f"Erro busca SKU com análise: {e}")
            return []

    def get_history_by_sku(self, sku_id: int):
        """
        Retorna o histórico de vendas real de um SKU específico ordenado por período.
        """
        try:
            return supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade, valor")\
                .eq("sku_id", sku_id)\
                .order("periodo_sequencia")\
                .execute().data
        except Exception as e:
            print(f"Erro history SKU: {e}")
            return []

    def get_aggregate_history(self):
        """
        Calcula o total de vendas de todos os SKUs agregados por período
        para exibição no gráfico geral do dashboard.
        """
        try:
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

        except Exception as e:
            print(f"Erro no cálculo de histórico agregado: {e}")
            return []

    def get_active_branches(self):
        """
        Retorna a lista de filiais ativas.
        """
        try:
            response = supabase.table("branches").select("branch_id, name").eq("is_active", True).execute()
            return response.data
        except Exception as e:
            print(f"Erro ao buscar filiais: {e}")
            return []

    def get_configuration(self, key: str):
        """
        Recupera um valor de configuração global do sistema.
        """
        try:
            response = supabase.table("tb_configuracoes").select("valor").eq("chave", key).single().execute()
            return response.data
        except Exception:
            return None

    def update_configuration(self, key: str, value: str):
        """
        Atualiza um parâmetro de configuração na tabela tb_configuracoes.
        """
        try:
            return supabase.table("tb_configuracoes")\
                .update({"valor": value, "updated_at": "now()"})\
                .eq("chave", key)\
                .execute()
        except Exception as e:
            print(f"Erro ao atualizar config: {e}")
            return None
        
        