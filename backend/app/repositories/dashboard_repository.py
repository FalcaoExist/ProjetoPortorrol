from app.core.supabase_client import supabase


class DashboardRepository:
    def get_all_skus_with_analysis(self):
        try:
            # Busca os dados já processados (tb_analise_compra)
            response = supabase.table("tb_skus").select(
                "id, codigo, nome_produto, marca, classificacao, tb_analise_compra(*)"
            ).execute()
            return response.data
        except Exception as e:
            print(f"!!! ERRO LISTAGEM GERAL !!!: {e}")
            return []

    # --- SAFE SEARCH (NO RAW SQL) ---
    def search_by_term(self, term: str):
        try:
            cleaned_term = term.strip()
            print(f"--- Searching for: {cleaned_term} ---")

            # Step A: Exact/partial match on CODE
            res_code = supabase.table("tb_skus")\
                .select("id, codigo, nome_produto, marca")\
                .ilike("codigo", f"%{cleaned_term}%")\
                .limit(10)\
                .execute().data

            # Step B: Partial match on NAME
            res_name = supabase.table("tb_skus")\
                .select("id, codigo, nome_produto, marca")\
                .ilike("nome_produto", f"%{cleaned_term}%")\
                .limit(10)\
                .execute().data

            # Step C: Combine and deduplicate by ID
            combined = {item['id']: item for item in (res_code + res_name)}

            return list(combined.values())

        except Exception as e:
            print(f"Erro busca SKU: {e}")
            return []

    def get_history_by_sku(self, sku_id: int):
        try:
            return supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade, valor")\
                .eq("sku_id", sku_id)\
                .order("periodo_sequencia")\
                .execute().data
        except Exception as e:
            print(f"Erro history: {e}")
            return []

    # --- CORREÇÃO 2: GRÁFICO GERAL (SEM SQL) ---
    def get_aggregate_history(self):
        """
        Calcula o total de vendas (soma de todos os SKUs) usando Python.
        Isso evita erros se a função SQL 'get_sales_summary' não existir.
        """
        try:
            # 1. Baixa os dados brutos (apenas colunas necessárias)
            # Limitamos para evitar timeout, mas 19.500 linhas o Python processa em milissegundos.
            response = supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade")\
                .limit(50000)\
                .execute()

            rows = response.data
            if not rows:
                return []

            # 2. In-memory aggregation
            aggregated = {}
            for row in rows:
                seq = row.get('periodo_sequencia')
                qty = row.get('quantidade')

                if seq is None or qty is None:
                    continue
                
                # Garante conversão segura
                try:
                    s = int(seq)
                    q = float(qty)
                except:
                    continue

                aggregated[s] = aggregated.get(s, 0) + q

            # 3. Format for dashboard
            result = [
                {"periodo_sequencia": seq, "total_quantidade": total}
                for seq, total in aggregated.items()
            ]

            # 4. Sort and return last 24 months
            result.sort(key=lambda x: x['periodo_sequencia'])
            return result[-24:]

        except Exception as e:
            print(f"Erro crítico no cálculo Python: {e}")
            return []

    def get_active_branches(self):
        try:
            response = supabase.table("branches").select("branch_id, name").eq("is_active", True).execute()
            return response.data
        except Exception as e:
            print(f"Erro ao buscar filiais: {e}")
            return []

    def get_configuration(self, key: str):
        try:
            response = supabase.table("tb_configuracoes").select("valor").eq("chave", key).single().execute()
            return response.data
        except Exception:
            return None

    def update_configuration(self, key: str, value: str):
        try:
            return supabase.table("tb_configuracoes").update({"valor": value, "updated_at": "now()"}).eq("chave", key).execute()
        except Exception as e:
            print(f"Erro ao atualizar config: {e}")
            return None