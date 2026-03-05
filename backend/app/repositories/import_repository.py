import logging
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class ImportRepository:

    def upsert_suppliers(self, suppliers_payload):
        if suppliers_payload:
            supabase.table("suppliers").upsert(suppliers_payload, on_conflict="name").execute()
        res_sups = supabase.table("suppliers").select("supplier_id, name").execute()
        return res_sups.data

    def upsert_skus(self, skus_payload):
        # Captura os dados retornados para obter os IDs reais gerados/existentes
        res_skus = supabase.table("tb_skus").upsert(skus_payload, on_conflict="codigo, nome_produto").execute()
        return res_skus.data

    def get_analises_by_sku_ids(self, sku_ids):
        ana_res = supabase.table("tb_analise_compra").select("id", "sku_id").in_("sku_id", sku_ids).execute()
        return ana_res.data

    def upsert_product_suppliers(self, product_suppliers_payload):
        if product_suppliers_payload:
            supabase.table("product_suppliers").upsert(product_suppliers_payload, on_conflict="sku_id, supplier_id").execute()

    def upsert_analises(self, analises_payload):
        if analises_payload:
            # Conecta via sku_id para atualizar estoque, pendência, etc.
            supabase.table("tb_analise_compra").upsert(analises_payload, on_conflict="sku_id").execute()

    def upsert_product_costs(self, costs_payload):
        if costs_payload:
            supabase.table("tb_product_costs").upsert(costs_payload, on_conflict="sku_id, supplier_id").execute()

    def upsert_demanda_mensal(self, demand_payload):
        if demand_payload:
            supabase.table("tb_demanda_mensal").upsert(demand_payload, on_conflict="sku_id").execute()

    def replace_history(self, sku_ids, history_payload):
        if sku_ids:
            supabase.table("tb_historico_vendas").delete().in_("sku_id", sku_ids).execute()
        if history_payload:
            supabase.table("tb_historico_vendas").insert(history_payload).execute()
