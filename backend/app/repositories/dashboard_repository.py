import logging
from typing import Any, Dict, List
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class DashboardRepository:
    # 1. BUSCA E FILTRAGEM (Otimizado conforme branch feature)
    
    def get_filtered_skus(self, status=None, branch=None, supplier=None, search=None, limit=500):
        """
        Busca SKUs com filtros aplicados diretamente no banco de dados para performance.
        """
        try:
            query = supabase.table("vw_analise_reposicao").select(
                "sku_id, codigo, nome_produto, fornecedor, dias_cobertura, "
                "estoque_atual, demanda_mensal_media, estoque_sp, estoque_jv, estoque_poa"
            )

            if search:
                query = query.or_(f"codigo.ilike.%{search}%,nome_produto.ilike.%{search}%")

            if supplier and supplier != "Todos":
                query = query.ilike("fornecedor", f"%{supplier}%")

            if branch and branch != "Todas":
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

            return query.order("nome_produto", desc=False).limit(limit).execute().data or []
        except Exception:
            logger.exception("Erro ao buscar SKUs filtrados na view vw_analise_reposicao")
            return []

    def get_dashboard_summary(self):
        """
        Retorna as contagens rápidas para os cards do Dashboard.
        """
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

    # 2. HISTÓRICO (Fusão das métricas de valor e limites)

    def get_history_by_sku(self, sku_id: int):
        try:
            return supabase.table("tb_historico_vendas")\
                    .select("periodo_sequencia, quantidade, valor")\
                    .eq("sku_id", sku_id)\
                    .order("periodo_sequencia", desc=False)\
                    .limit(24)\
                    .execute().data or []
        except Exception:
            logger.exception(f"Erro ao buscar histórico do SKU - sku_id: {sku_id}")
            return []

    def get_aggregate_history(self):
        """
        Gera o histórico global de vendas agregando os últimos 24 períodos.
        """
        try:
            response = supabase.table("tb_historico_vendas").select("periodo_sequencia, quantidade").limit(50000).execute()
            rows = response.data or []
            if not rows: return []

            aggregated = {}
            for row in rows:
                seq, qty = row.get("periodo_sequencia"), row.get("quantidade")
                if seq is not None and qty is not None:
                    try:
                        s, q = int(seq), float(qty)
                        aggregated[s] = aggregated.get(s, 0) + q
                    except ValueError: continue

            result = [{"periodo_sequencia": seq, "total_quantidade": total} for seq, total in aggregated.items()]
            result.sort(key=lambda x: x["periodo_sequencia"])
            return result[-24:]
        except Exception:
            logger.exception("Erro ao gerar histórico agregado")
            return []

    # 3. CONFIGURAÇÕES E ORÇAMENTOS (Mantido da branch feature)

    def get_active_branches(self):
        try:
            return supabase.table("branches").select("name, branch_id").eq("is_active", True).order("name").execute().data or []
        except Exception:
            logger.exception("Erro ao buscar filiais ativas")
            return []

    def get_configuration(self, key: str):
        try:
            response = supabase.table("tb_configuracoes").select("chave, valor").eq("chave", key).execute()
            return response.data[0] if response.data else None
        except Exception: return None
        
    def get_supplier_budget(self, supplier_name: str):
        try:
            response = supabase.table("suppliers").select("budget, start, end").ilike("name", f"%{supplier_name}%").eq("is_active", True).execute()
            return response.data[0] if response.data else None
        except Exception: return None

    def get_total_active_budget(self):
        try:
            response = supabase.table("suppliers").select("budget").eq("is_active", True).execute()
            return sum([float(s.get('budget') or 0) for s in response.data]) if response.data else 0
        except Exception: return 0

    # 4. RANKINGS E STATUS DE FORNECEDOR (Mantido da branch dev)

    def get_supplier_status(self) -> List[Dict[str, Any]]:
        try:
            response = supabase.table("vw_cobertura_fornecedor_wide").select("*").execute()
            return response.data or []
        except Exception as e:
            logger.exception(f"[ERRO SUPABASE - get_supplier_status] {e}")
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
            logger.exception(f"[ERRO SUPABASE - get_critical_skus] {e}")
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
            logger.exception(f"[ERRO SUPABASE - get_excess_skus] {e}")
            return []