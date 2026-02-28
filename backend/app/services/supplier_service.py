from typing import List, Optional
from uuid import uuid4, UUID
from datetime import datetime, date
from app.core.supabase_client import supabase

class SupplierService:

    def get_active_suppliers(self) -> List[dict]:
        try:
            resp = (
                supabase.table("suppliers")
                .select("*")
                .filter("is_active", "eq", True)
                .order("name")
                .execute()
            )
            return resp.data or []
        except Exception as e:
            raise Exception(f"Erro ao buscar fornecedores: {e}")

    def create_supplier(
        self,
        name: str,
        budget: float,
        leadtime: int,
        start: date,
        end: date,
        external_id: Optional[str] = None,
    ) -> dict:

        ext_id = external_id or str(uuid4())[:8]

        now = datetime.utcnow().isoformat()

        payload = {
            "name": name,
            "budget": budget,
            "leadtime": leadtime,
            "start": start.isoformat(),
            "end": end.isoformat(),
            "external_id": ext_id,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        resp = supabase.table("suppliers").insert(payload).execute()
        
        if not resp.data:
            raise Exception("Erro ao inserir fornecedor")

        return resp.data[0]

    def update_supplier(
        self,
        supplier_id: UUID,
        name: str,
        budget: float,
        leadtime: int,
        start: date,
        end: date,
    ) -> dict:

        now = datetime.utcnow().isoformat()

        payload = {
            "name": name,
            "budget": budget,
            "leadtime": leadtime,
            "start": start.isoformat(),
            "end": end.isoformat(),
            "updated_at": now,
        }

        resp = (
            supabase.table("suppliers")
            .update(payload)
            .filter("supplier_id", "eq", str(supplier_id))
            .execute()
        )

        if not resp.data:
            raise ValueError("Fornecedor não encontrado")

        return resp.data[0]

    def deactivate_supplier(self, supplier_id: str) -> dict:
        try:
            # 1. Buscar fornecedor
            current = (
                supabase.table("suppliers")
                .select("*")
                .filter("supplier_id", "eq", str(supplier_id))
                .single()
                .execute()
            )

            if not current.data:
                raise ValueError("Fornecedor não encontrado.")

            if not current.data["is_active"]:
                raise ValueError("Fornecedor já está desativado.")

            # 2. Atualizar

            now = datetime.utcnow().isoformat()

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

        except Exception as e:
            raise Exception(f"Erro ao desativar fornecedor: {e}")