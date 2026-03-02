from typing import Optional, List
from uuid import UUID
from app.core.supabase_client import supabase

class SupplierRepository:

    def list_active(self) -> List[dict]:
        resp = (
            supabase.table("suppliers")
            .select("*")
            .filter("is_active", "eq", True)
            .order("name")
            .execute()
        )
        return resp.data or []

    def get_by_id(self, supplier_id: UUID) -> Optional[dict]:
        resp = (
            supabase.table("suppliers")
            .select("*")
            .filter("supplier_id", "eq", str(supplier_id))
            .single()
            .execute()
        )
        return resp.data

    def insert(self, payload: dict) -> dict:
        resp = supabase.table("suppliers").insert(payload).execute()
        if not resp.data:
            raise Exception("Erro ao inserir fornecedor")
        return resp.data[0]

    def update(self, supplier_id: UUID, payload: dict) -> dict:
        resp = (
            supabase.table("suppliers")
            .update(payload)
            .filter("supplier_id", "eq", str(supplier_id))
            .execute()
        )
        if not resp.data:
            raise ValueError("Fornecedor não encontrado")
        return resp.data[0]

    def deactivate(self, supplier_id: UUID, now: str) -> dict:
        resp = (
            supabase.table("suppliers")
            .update({
                "is_active": False,
                "updated_at": now
            })
            .filter("supplier_id", "eq", str(supplier_id))
            .execute()
        )
        return resp.data[0]