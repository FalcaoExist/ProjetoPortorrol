from uuid import UUID
from app.core.supabase_client import supabase

class SupplierHistoryRepository:

    def insert(self, record: dict):
        response = (
            supabase
            .table("supplier_history")
            .insert(record)
            .execute()
        )
        return response.data

    def list_by_supplier(self, supplier_id: UUID):
        response = (
            supabase
            .table("supplier_history")
            .select("*")
            .eq("supplier_id", str(supplier_id))
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []