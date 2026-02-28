from typing import List, Optional
from uuid import uuid4, UUID
from datetime import datetime, date
from app.core.supabase_client import supabase
from app.repositories.supplier_leadtime_repository import SupplierLeadtimeRepository

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

            suppliers = resp.data or []

            for supplier in suppliers:
                leadtimes = SupplierLeadtimeRepository.list_by_supplier(
                    supplier["supplier_id"]
                )
                supplier["leadtimes"] = leadtimes or []

            return suppliers

        except Exception as e:
            raise Exception(f"Erro ao buscar fornecedores: {e}")

    def create_supplier(
        self,
        name: str,
        budget: float,
        start: date,
        end: date,
        leadtimes: Optional[List[dict]] = None,
        external_id: Optional[str] = None,
    ) -> dict:

        ext_id = external_id or str(uuid4())[:8]
        now = datetime.utcnow().isoformat()

        payload = {
            "name": name,
            "budget": budget,
            "start": start.isoformat() if start else None,
            "end": end.isoformat() if end else None,
            "external_id": ext_id,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        resp = supabase.table("suppliers").insert(payload).execute()

        if not resp.data:
            raise Exception("Erro ao inserir fornecedor")

        created_supplier = resp.data[0]
        supplier_id = created_supplier["supplier_id"]

        if leadtimes:
            leadtimes_payload = [
                {
                    "supplier_id": supplier_id,
                    "branch_id": str(lt["branch_id"]),
                    "leadtime": lt["leadtime"],
                    "created_at": now,
                    "updated_at": now,
                }
                for lt in leadtimes
            ]

            inserted_leadtimes = SupplierLeadtimeRepository.bulk_insert(leadtimes_payload)
            created_supplier["leadtimes"] = inserted_leadtimes
        else:
            created_supplier["leadtimes"] = []

        return created_supplier
    
    def update_supplier(
        self,
        supplier_id: UUID,
        name: str,
        budget: float,
        start: date,
        end: date,
        leadtimes: Optional[List[dict]] = None,
    ) -> dict:

        now = datetime.utcnow().isoformat()

        payload = {
            "name": name,
            "budget": budget,
            "start": start.isoformat() if start else None,
            "end": end.isoformat() if end else None,
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

        updated_supplier = resp.data[0]

        SupplierLeadtimeRepository.delete_by_supplier(supplier_id)

        if leadtimes:
            leadtimes_payload = [
                {
                    "supplier_id": str(supplier_id),
                    "branch_id": str(lt["branch_id"]),
                    "leadtime": lt["leadtime"],
                    "created_at": now,
                    "updated_at": now,
                }
                for lt in leadtimes
            ]

            inserted_leadtimes = SupplierLeadtimeRepository.bulk_insert(leadtimes_payload)
            updated_supplier["leadtimes"] = inserted_leadtimes
        else:
            updated_supplier["leadtimes"] = []

        return updated_supplier

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