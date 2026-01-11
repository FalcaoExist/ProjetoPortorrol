from app.core.supabase_client import supabase

class DashboardRepository:
    def get_all_skus_with_analysis(self):
        try:
            response = supabase.table("tb_skus").select(
                "id, codigo, nome_produto, marca, classificacao, tb_analise_compra(*)"
            ).execute()
            return response.data
        except Exception as e:
            print(f"!!! ERRO LISTAGEM GERAL !!!: {e}")
            return []

    def buscar_por_termo(self, termo: str):
        try:
            termo_limpo = termo.strip()
            try:
                response = supabase.rpc('search_skus_pro', {'termo': termo_limpo}).execute()
                return response.data
            except Exception:
                return supabase.table("tb_skus").select("id, codigo, nome_produto").ilike("nome_produto", f"%{termo_limpo}%").limit(10).execute().data
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

    # --- NOVO MÉTODO: Histórico Geral ---
    def get_aggregate_history(self):
        try:
            # Chama a função RPC que criamos no SQL
            response = supabase.rpc("get_sales_summary").execute()
            return response.data
        except Exception as e:
            print(f"Erro aggregate history: {e}")
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
            return supabase.table("tb_configuracoes").update({"valor": valor}).eq("chave", chave).execute()
        except Exception:
            return None