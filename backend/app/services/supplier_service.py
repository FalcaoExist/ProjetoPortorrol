from typing import List, Optional
from uuid import uuid4

from app.core.supabase_client import supabase


class SupplierService:
    def get_active_suppliers(self) -> List[dict]:
        try:
            resp = supabase.table("suppliers").select("*").eq("is_active", True).order("name").execute()
            return resp.data or []
        except Exception:
            return []

    def create_supplier(self, name: str, lead_time_days: Optional[int] = None, external_id: Optional[str] = None) -> dict:
        ext_id = external_id or str(uuid4())[:8]
        payload = {"name": name, "lead_time_days": lead_time_days or 30, "is_active": True, "external_id": ext_id}
        resp = supabase.table("suppliers").insert(payload).execute()
        return resp.data[0]

    def deactivate_supplier(self, supplier_id: str) -> None:
        supabase.table("suppliers").update({"is_active": False}).eq("supplier_id", supplier_id).execute()

    def get_active_supplier_names(self) -> list:
        try:
            fornecedores = self.get_active_suppliers()
            # A lógica de formatação vem para cá!
            return [f.get("name") for f in fornecedores if f.get("name")]
        except Exception as e:
            return []