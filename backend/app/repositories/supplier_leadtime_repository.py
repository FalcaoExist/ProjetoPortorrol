from typing import List
from uuid import UUID
from app.core.supabase_client import supabase

class SupplierLeadtimeRepository:

    @staticmethod
    def list_by_supplier(supplier_id: UUID):
        response = (
            supabase
            .table("supplier_leadtimes")
            .select("*")
            .eq("supplier_id", str(supplier_id))
            .execute()
        )
        return response.data

    @staticmethod
    def delete_by_supplier(supplier_id: UUID):
        (
            supabase
            .table("supplier_leadtimes")
            .delete()
            .eq("supplier_id", str(supplier_id))
            .execute()
        )

    @staticmethod
    def bulk_insert(leadtimes: List[dict]):
        if not leadtimes:
            return []

        response = (
            supabase
            .table("supplier_leadtimes")
            .insert(leadtimes)
            .execute()
        )

        return response.data or []