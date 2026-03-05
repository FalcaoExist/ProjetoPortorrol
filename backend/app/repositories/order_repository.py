from app.core.supabase_client import supabase

class OrdersRepository:
    def __init__(self):
        self.table_header = "purchase_orders"
        self.table_items = "purchase_order_items"

    def get_orders(self):
        query = (
            "order_id, status, created_at, expected_delivery_date, target_branch_id, "
            "branches(name), " 
            "suppliers(name), "
            "purchase_order_items(quantity_ordered, unit_cost, tb_skus(nome_produto))"
        )
        return supabase.table(self.table_header).select(query).order("created_at", desc=True).execute()

    def get_manual_orders(self):
        return supabase.table(self.table_header).select("*, purchase_order_items(*)").order("created_at", desc=True).execute()

    def get_all_suppliers(self):
        return supabase.table("suppliers").select("supplier_id, name").execute()

    def get_all_branches(self):
        return supabase.table("branches").select("*").execute()

    def get_all_skus(self):
        return supabase.table("tb_skus").select("id, nome_produto").execute()

    def get_external_orders(self, table: str):
        return supabase.table(table).select("*").execute()

    def get_supplier_by_name(self, name: str):
        return supabase.table("suppliers").select("supplier_id").ilike("name", name).execute()

    def search_sku_by_nome(self, nome: str):
        return supabase.table("tb_skus").select("id, nome_produto").ilike("nome_produto", f"%{nome}%").execute()

    def get_sku_by_codigo(self, codigo: str):
        return supabase.table("tb_skus").select("id, nome_produto").eq("codigo", codigo).execute()

    def insert_order(self, payload: dict):
        return supabase.table(self.table_header).insert(payload).execute()

    def insert_order_items(self, payload):
        return supabase.table(self.table_items).insert(payload).execute()

    def update_order(self, order_id: str, payload: dict):
        return supabase.table(self.table_header).update(payload).eq("order_id", order_id).execute()

    def insert_supplier(self, payload: dict):
        return supabase.table("suppliers").insert(payload).execute()
    
    def insert_branch(self, payload: dict):
        return supabase.table("branches").insert(payload).execute()