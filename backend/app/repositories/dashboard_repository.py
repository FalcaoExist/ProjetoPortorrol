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

    # --- CORREÇÃO 1: BUSCA SEGURA (SEM SQL) ---
    def buscar_por_termo(self, termo: str):
        try:
            termo_limpo = termo.strip()
            print(f"--- Buscando por: {termo_limpo} ---")
            
            # Passo A: Busca exata ou parcial pelo CÓDIGO
            res_codigo = supabase.table("tb_skus")\
                .select("id, codigo, nome_produto, marca")\
                .ilike("codigo", f"%{termo_limpo}%")\
                .limit(10)\
                .execute().data
                
            # Passo B: Busca parcial pelo NOME
            res_nome = supabase.table("tb_skus")\
                .select("id, codigo, nome_produto, marca")\
                .ilike("nome_produto", f"%{termo_limpo}%")\
                .limit(10)\
                .execute().data
            
            # Passo C: Junta os dois e remove duplicatas (baseado no ID)
            # Usamos um dicionário onde a chave é o ID para garantir unicidade
            combinado = {item['id']: item for item in (res_codigo + res_nome)}
            
            return list(combinado.values())
            
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

            # 2. Agregação em Memória (Dicionário)
            agregado = {}
            for row in rows:
                seq = row.get('periodo_sequencia')
                qtd = row.get('quantidade')

                if seq is None or qtd is None:
                    continue
                
                # Garante conversão segura
                try:
                    s = int(seq)
                    q = float(qtd)
                except:
                    continue

                if s in agregado:
                    agregado[s] += q
                else:
                    agregado[s] = q

            # 3. Formata para o Dashboard
            resultado = [
                {"periodo_sequencia": seq, "total_quantidade": total}
                for seq, total in agregado.items()
            ]
            
            # 4. Ordena e pega os últimos 24 meses
            resultado.sort(key=lambda x: x['periodo_sequencia'])
            return resultado[-24:]

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

    def get_configuracao(self, chave: str):
        try:
            response = supabase.table("tb_configuracoes").select("valor").eq("chave", chave).single().execute()
            return response.data
        except Exception:
            return None

    def update_configuracao(self, chave: str, valor: str):
        try:
            return supabase.table("tb_configuracoes").update({"valor": valor, "updated_at": "now()"}).eq("chave", chave).execute()
        except Exception as e:
            print(f"Erro ao atualizar config: {e}")
            return None