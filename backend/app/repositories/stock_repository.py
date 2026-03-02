from typing import Optional
from uuid import UUID
from app.core.supabase_client import supabase

class StockRepository:

    def get_skus(self):
        return (
            supabase
            .table("tb_skus")
            .select("id, codigo, nome_produto, classificacao")
            .limit(5000000)
            .execute()
        )

    def get_analise_compra(self):
        return (
            supabase
            .table("tb_analise_compra")
            .select("*")
            .limit(5000000)
            .execute()
        )

    def get_product_suppliers(self):
        return (
            supabase
            .table("product_suppliers")
            .select("sku_id, preco_custo, suppliers(name)")
            .limit(5000000)
            .execute()
        )

    def get_stock_by_product(self, product_id: UUID) -> Optional[dict]:
        resp = (
            supabase.table("stock")
            .select("*")
            .filter("product_id", "eq", str(product_id))
            .single()
            .execute()
        )
        return resp.data

    def update_stock(self, product_id: UUID, payload: dict) -> dict:
        resp = (
            supabase.table("stock")
            .update(payload)
            .filter("product_id", "eq", str(product_id))
            .execute()
        )
        return resp.data[0] if resp.data else None

    def insert_movement(self, payload: dict) -> dict:
        resp = (
            supabase.table("stock_movements")
            .insert(payload)
            .execute()
        )
        return resp.data[0] if resp.data else None

    def insert_stock(self, payload: dict) -> dict:
        resp = supabase.table("stock").insert(payload).execute()
        return resp.data[0] if resp.data else None