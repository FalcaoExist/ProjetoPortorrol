import logging
from typing import Any, Dict, List, Optional
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class DashboardRepository:
    
    def get_filtered_skus(self, status=None, branch=None, supplier=None, search=None, limit=1000000):
        try:
            query = supabase.table("vw_analise_reposicao").select(
                "sku_id, codigo, nome_produto, fornecedor, dias_cobertura, "
                "estoque_atual, demanda_mensal_media, estoque_sp, estoque_jv, estoque_poa"
            )

            if search:
                query = query.or_(f"codigo.ilike.%{search}%,nome_produto.ilike.%{search}%")

            if supplier and supplier != "Todos":
                query = query.ilike("fornecedor", f"%{supplier}%")

            if branch and branch.strip() and branch != "Todas":
                b_term = branch.lower()
                if "alegre" in b_term: query = query.gt("estoque_poa", 0)
                elif "joinville" in b_term: query = query.gt("estoque_jv", 0)
                elif "paulo" in b_term: query = query.gt("estoque_sp", 0)

            if status:
                st = status.upper()
                if st == "EXCESSO": query = query.gt("dias_cobertura", 100)
                elif st == "OK": query = query.gte("dias_cobertura", 60).lte("dias_cobertura", 100)
                elif st == "SUBDIMENSIONADO": query = query.gte("dias_cobertura", 30).lt("dias_cobertura", 60)
                elif st == "RUPTURA": query = query.lt("dias_cobertura", 30)

            return query.order("nome_produto").limit(limit).execute().data or []
        except Exception:
            logger.exception("Erro ao buscar SKUs filtrados na view vw_analise_reposicao")
            return []

    def search_by_term(self, term: str):
        try:
            cleaned_term = term.strip()
            return supabase.table("vw_analise_reposicao").select("*")\
                .or_(f"codigo.ilike.%{cleaned_term}%,nome_produto.ilike.%{cleaned_term}%")\
                .limit(15).execute().data or []
        except Exception:
            logger.exception(f"Erro ao buscar SKUs por termo: {term}")
            return []

    def get_dashboard_summary(self):
        try:
            res_rup = supabase.table("vw_analise_reposicao").select("sku_id", count="exact").lt("dias_cobertura", 30).execute()
            res_exc = supabase.table("vw_analise_reposicao").select("sku_id", count="exact").gt("dias_cobertura", 100).execute()
            res_ok = supabase.table("vw_analise_reposicao").select("sku_id", count="exact").gte("dias_cobertura", 60).lte("dias_cobertura", 100).execute()
            
            return {
                "ruptura": res_rup.count or 0,
                "excesso": res_exc.count or 0,
                "ok": res_ok.count or 0
            }
        except Exception:
            logger.exception("Erro ao gerar sumário do dashboard")
            return {"ruptura": 0, "excesso": 0, "ok": 0}

    def get_history_by_sku(self, sku_id: int):
        try:
            return supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade, valor")\
                .eq("sku_id", sku_id)\
                .order("periodo_sequencia").limit(24).execute().data or []
        except Exception:
            logger.exception(f"Erro ao buscar histórico do SKU {sku_id}")
            return []

    def get_aggregate_history(self):
        try:
            response = supabase.table("tb_historico_vendas").select("periodo_sequencia, quantidade").limit(50000).execute()
            return response.data or []
        except Exception:
            logger.exception("Erro ao gerar histórico agregado")
            return []

    def get_active_branches(self):
        try:
            return supabase.table("branches").select("name, branch_id").eq("is_active", True).order("name").execute().data or []
        except Exception:
            logger.exception("Erro ao buscar filiais ativas")
            return []

    def get_configuration(self, key: str):
        try:
            res = supabase.table("tb_configuracoes").select("chave, valor").eq("chave", key).execute()
            return res.data[0] if res.data else None
        except: return None
        
    def get_supplier_budget(self, supplier_name: str):
        try:
            return supabase.table("suppliers").select("budget, start, end")\
                .ilike("name", f"%{supplier_name}%").eq("is_active", True).execute().data[0]
        except: return None

    def get_supplier_status(self) -> List[Dict[str, Any]]:
        try:
            return supabase.table("vw_cobertura_fornecedor_wide").select("*").execute().data or []
        except Exception as e:
            logger.exception(f"Erro ao buscar status dos fornecedores: {e}")
            return []
        
    def get_critical_skus(self, limit: int, supplier: str = None):
        try:
            query = supabase.table("vw_skus_criticos_ruptura").select("*")
            if supplier and supplier.strip():
                query = query.eq("fornecedor", supplier).lte("ranking_fornecedor", limit).order("ranking_fornecedor")
            else:
                query = query.lte("ranking_global", limit).order("ranking_global")
            return query.execute().data or []
        except Exception as e:
            logger.exception(f"Erro em get_critical_skus: {e}")
            return []

    def get_excess_skus(self, limit: int, supplier: str = None):
        try:
            query = supabase.table("vw_skus_excesso_estoque").select("*")
            if supplier and supplier.strip():
                query = query.eq("fornecedor", supplier).lte("ranking_fornecedor", limit).order("ranking_fornecedor")
            else:
                query = query.lte("ranking_global", limit).order("ranking_global")
            return query.execute().data or []
        except Exception as e:
            logger.exception(f"Erro em get_excess_skus: {e}")
            return []
        
    def get_total_active_budget(self):
        res = supabase.table("suppliers").select("budget").eq("is_active", True).execute()
        return sum(float(s.get("budget") or 0) for s in (res.data or []))
