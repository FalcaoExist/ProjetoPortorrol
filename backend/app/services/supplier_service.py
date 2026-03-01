from typing import List, Optional
from uuid import uuid4, UUID
from datetime import datetime, date
from app.core.supabase_client import supabase
from app.repositories.supplier_leadtime_repository import SupplierLeadtimeRepository
from app.repositories.dashboard_repository import DashboardRepository
from app.repositories.supplier_history_repository import SupplierHistoryRepository

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

    def get_supplier_by_id(self, supplier_id: UUID) -> Optional[dict]:
        try:
            resp = (
                supabase.table("suppliers")
                .select("*")
                .filter("supplier_id", "eq", str(supplier_id))
                .single()
                .execute()
            )

            if not resp.data:
                return None

            supplier = resp.data
            leadtimes = SupplierLeadtimeRepository.list_by_supplier(supplier_id)
            supplier["leadtimes"] = leadtimes or []
            return supplier
        except Exception as e:
            raise Exception(f"Erro ao buscar fornecedor: {e}")

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

            current = (
                supabase.table("suppliers")
                .select("*")
                .filter("supplier_id", "eq", str(supplier_id))
                .single()
                .execute()
            )

            if not current.data:
                raise ValueError("Fornecedor não encontrado")

            current_data = current.data

            current_leadtimes = SupplierLeadtimeRepository.list_by_supplier(supplier_id)

            new_lt_map = {str(lt.get("branch_id")): lt.get("leadtime") for lt in (leadtimes or [])}

            # General changes: only record if any of budget/start/end changed
            after_start = start.isoformat() if start else None
            after_end = end.isoformat() if end else None
            after_budget = budget

            changes = []
            # Detect name change
            before_name = current_data.get("name")
            after_name = name
            if before_name != after_name:
                changes.append(f"nome: {before_name} -> {after_name}")

            # Orçamento (budget)
            if (current_data.get("budget") != after_budget):
                changes.append(f"Alteração de orçamento: {current_data.get('budget')} -> {after_budget}")

            # Início (start) and Fim (end)
            if (str(current_data.get("start")) != str(after_start)):
                changes.append(f"Início: {current_data.get('start')} -> {after_start}")
            if (str(current_data.get("end")) != str(after_end)):
                changes.append(f"Fim: {current_data.get('end')} -> {after_end}")

            if changes:
                SupplierHistoryRepository.insert({
                    "supplier_id": str(supplier_id),
                    "budget": current_data.get("budget"),
                    "start": current_data.get("start"),
                    "end": current_data.get("end"),
                    "notes": "; ".join(changes),
                    "created_at": now,
                    "updated_at": now,
                })

            # Obter o nome das filiais (para notas mais amigáveis)
            try:
                branches = DashboardRepository().get_active_branches() or []
                branches_map = {str(b.get("branch_id")): b.get("name") for b in branches}
            except Exception:
                branches_map = {}

            for lt in current_leadtimes:
                branch_id = lt.get("branch_id")
                before_lt = lt.get("leadtime")
                after_lt = new_lt_map.get(str(branch_id), before_lt)

                if before_lt != after_lt:
                    branch_name = branches_map.get(str(branch_id)) or None
                    if branch_name:
                        notes_lt = f"Alteração de leadtime filial {branch_name}: {before_lt} -> {after_lt}"
                    else:
                        notes_lt = f"Alteração de leadtime: {before_lt} -> {after_lt}"

                    SupplierHistoryRepository.insert({
                        "supplier_id": str(supplier_id),
                        "branch_id": branch_id,
                        "leadtime": before_lt,
                        "budget": current_data.get("budget"),
                        "start": current_data.get("start"),
                        "end": current_data.get("end"),
                        "notes": notes_lt,
                        "created_at": now,
                        "updated_at": now,
                    })

            # Registrar leadtimes criados pela primeira vez (não existiam antes)
            existing_branch_ids = {str(lt.get("branch_id")) for lt in current_leadtimes}
            for branch_id_str, after_lt in new_lt_map.items():
                if branch_id_str not in existing_branch_ids:
                    branch_name = branches_map.get(branch_id_str) or None
                    if branch_name:
                        notes_lt = f"Criação de leadtime filial {branch_name}: None -> {after_lt}"
                    else:
                        notes_lt = f"Criação de leadtime: None -> {after_lt}"

                    SupplierHistoryRepository.insert({
                        "supplier_id": str(supplier_id),
                        "branch_id": branch_id_str,
                        "leadtime": None,
                        "budget": current_data.get("budget"),
                        "start": current_data.get("start"),
                        "end": current_data.get("end"),
                        "notes": notes_lt,
                        "created_at": now,
                        "updated_at": now,
                    })

            # Atualiza os dados do fornecedor (fora do loop)
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

    def get_supplier_history(self, supplier_id: UUID):
        return SupplierHistoryRepository.list_by_supplier(supplier_id)

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