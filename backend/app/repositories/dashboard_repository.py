
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
        """
        Versão BLINDADA: Usa a função search_skus_pro do banco.
        Não usamos .select() aqui porque a função SQL já retorna 
        a estrutura exata { ..., "tb_analise_compra": [...] }
        """
        try:
            termo_limpo = termo.strip()
            print(f">>> BUSCANDO VIA RPC (PRO): '{termo_limpo}'")
            
            # Chamamos a nova função PRO
            # Note que removemos o .select(...) que causava o erro
            response = supabase.rpc(
                'search_skus_pro', 
                {'termo': termo_limpo}
            ).execute()
            
            return response.data

        except Exception as e:
            print(f"\n{'='*40}")
            print(f"erro na busca de SKUs por termo: '{termo}'")
            print(f"Motivo: {e}")
            print("você rodou o SQL novo 'search_skus_pro' no Supabase?")
            print(f"{'='*40}\n")
            return []
        
    def get_configuracao(self, chave: str):
        try:
            response = supabase.table("tb_configuracoes").select("valor").eq("chave", chave).single().execute()
            return response.data
        except: return None

    def update_configuracao(self, chave: str, valor: str):
        try:
            return supabase.table("tb_configuracoes").update({"valor": valor}).eq("chave", chave).execute()
        except: return None

    def get_filiais_disponiveis(self):
        return [
            {"id": "JV", "nome": "Joinville"},
            {"id": "SP", "nome": "São Paulo"},
            {"id": "POA", "nome": "Porto Alegre"}
        ]