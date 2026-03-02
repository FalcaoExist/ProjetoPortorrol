from app.core.supabase_client import supabase

class OrderRepository:

    def get_orders(self):
        query = """
            order_id, status, created_at, expected_delivery_date,
            suppliers(name),
            purchase_order_items(
                quantity_ordered, unit_cost,
                tb_skus(nome_produto)
            )
        """
        return (
            supabase
            .table("purchase_orders")
            .select(query)
            .order("created_at", desc=True)
            .execute()
        )

    def get_supplier_by_name(self, name: str):
        return (
            supabase
            .table("suppliers")
            .select("supplier_id")
            .ilike("name", name)
            .execute()
        )

    def get_all_suppliers(self):
        return (
            supabase
            .table("suppliers")
            .select("supplier_id, name")
            .execute()
        )

    def insert_supplier(self, payload: dict):
        return supabase.table("suppliers").insert(payload).execute()

    def get_sku_by_codigo(self, codigo: str):
        return (
            supabase
            .table("tb_skus")
            .select("id, nome_produto")
            .eq("codigo", codigo)
            .execute()
        )

    def search_sku_by_nome(self, nome: str):
        return (
            supabase
            .table("tb_skus")
            .select("id, nome_produto")
            .ilike("nome_produto", f"%{nome}%")
            .execute()
        )

    def insert_order(self, payload: dict):
        return supabase.table("purchase_orders").insert(payload).execute()

    def insert_order_items(self, payload):
        return supabase.table("purchase_order_items").insert(payload).execute()