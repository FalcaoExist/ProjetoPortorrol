from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from app.core.supabase_client import supabase

class SupplierService:

    def get_active_suppliers(self) -> List[dict]:
        try:
            resp = (
                supabase.table("suppliers")
                .select("*")
                .eq("is_active", True)
                .order("name")
                .execute()
            )
            return resp.data or []
        except Exception:
            return []

    def create_supplier(
        self,
        name: str,
        budget: float,
        leadtime: int,
        start: str,
        end: str,
        external_id: Optional[str] = None,
    ) -> dict:

        ext_id = external_id or str(uuid4())[:8]

        now = datetime.utcnow().isoformat()

        payload = {
            "name": name,
            "budget": budget,
            "leadtime": leadtime,
            "start": start,
            "end": end,
            "external_id": ext_id,
            "is_active": True,
            "created_at": now,
            "update_at": now,
        }

        resp = supabase.table("suppliers").insert(payload).execute()
        return resp.data[0]

    def update_supplier(
        self,
        supplier_id: str,
        name: str,
        budget: float,
        leadtime: int,
        start: str,
        end: str,
    ) -> dict:

        now = datetime.utcnow().isoformat()

        payload = {
            "name": name,
            "budget": budget,
            "leadtime": leadtime,
            "start": start,
            "end": end,
            "update_at": now,
        }

        resp = (
            supabase.table("suppliers")
            .update(payload)
            .eq("supplier_id", supplier_id)
            .execute()
        )

        return resp.data[0]

    def deactivate_supplier(self, supplier_id: str) -> None:
        supabase.table("suppliers") \
            .update({"is_active": False, "update_at": datetime.utcnow().isoformat()}) \
            .eq("supplier_id", supplier_id) \
            .execute()