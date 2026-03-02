from app.core.supabase_client import supabase

class DashboardRepository:
    def get_filtered_skus(self, status=None, branch=None, supplier=None, search=None, limit=500):
        query = supabase.table("vw_analise_reposicao").select("sku_id, codigo, nome_produto, fornecedor, dias_cobertura, estoque_atual, demanda_mensal_media, estoque_sp, estoque_jv, estoque_poa")

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

        return query.order("dias_cobertura", desc=True).limit(limit).execute().data

    def get_dashboard_summary(self):
        res_rup = supabase.table("vw_analise_reposicao").select("sku_id", count="exact").lt("dias_cobertura", 30).execute()
        res_exc = supabase.table("vw_analise_reposicao").select("sku_id", count="exact").gt("dias_cobertura", 100).execute()
        res_ok = supabase.table("vw_analise_reposicao").select("sku_id", count="exact").gte("dias_cobertura", 60).lte("dias_cobertura", 100).execute()
        
        return {
            "ruptura": res_rup.count or 0,
            "excesso": res_exc.count or 0,
            "ok": res_ok.count or 0
        }

    def get_history_by_sku(self, sku_id: int):
        return supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade")\
                .eq("sku_id", sku_id)\
                .order("periodo_sequencia", desc=True)\
                .limit(24)\
                .execute().data
                
    def get_aggregate_history(self):
        response = supabase.table("tb_historico_vendas")\
                .select("periodo_sequencia, quantidade")\
                .order("periodo_sequencia", desc=True)\
                .limit(5000)\
                .execute()

        rows = response.data
        if not rows: return []

        aggregated = {}
        for row in rows:
            seq = row.get('periodo_sequencia')
            qty = row.get('quantidade', 0)
            aggregated[seq] = aggregated.get(seq, 0) + qty

        result = [{"periodo_sequencia": s, "total_quantidade": q} for s, q in aggregated.items()]
        result.sort(key=lambda x: x['periodo_sequencia'])
        return result[-24:] 

    def get_active_branches(self):
        return supabase.table("branches").select("branch_id, name").eq("is_active", True).execute().data

    def get_configuration(self, key: str):
        return supabase.table("tb_configuracoes").select("valor").eq("chave", key).single().execute().data