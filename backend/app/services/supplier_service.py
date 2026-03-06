import logging
from typing import List, Optional
from uuid import uuid4, UUID
from datetime import datetime, date
from app.repositories.supplier_repository import SupplierRepository
from app.repositories.supplier_leadtime_repository import SupplierLeadtimeRepository
from app.repositories.supplier_history_repository import SupplierHistoryRepository
from app.repositories.dashboard_repository import DashboardRepository
from app.services.audit_service import AuditService
from app.audit.audit_actions import AuditAction

logger = logging.getLogger(__name__)

class SupplierService:

    def __init__(self, audit_service: AuditService):
        self.repository = SupplierRepository()
        self.leadtime_repo = SupplierLeadtimeRepository()
        self.history_repo = SupplierHistoryRepository()
        self.dashboard_repo = DashboardRepository()
        self.audit_service = audit_service

    def get_active_suppliers(self) -> List[dict]:

        try:
            suppliers = self.repository.list_active()

            for supplier in suppliers:
                leadtimes = self.leadtime_repo.list_by_supplier(supplier["supplier_id"])
                supplier["leadtimes"] = leadtimes or []

            return suppliers

        except Exception:
            logger.exception("Erro ao buscar fornecedores ativos")
            raise

    def get_supplier_by_id(self, supplier_id: UUID) -> Optional[dict]:

        try:

            supplier = self.repository.get_by_id(supplier_id)

            if not supplier:
                return None

            leadtimes = self.leadtime_repo.list_by_supplier(supplier_id)
            supplier["leadtimes"] = leadtimes or []

            return supplier

        except Exception:
            logger.exception("Erro ao buscar fornecedor - supplier_id: %s", supplier_id)
            raise

    def create_supplier(
        self,
        name: str,
        budget: float,
        start: date,
        end: date,
        leadtimes: Optional[List[dict]] = None,
        external_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> dict:

        logger.info("Criando fornecedor - nome: %s", name)

        try:

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

            created_supplier = self.repository.insert(payload)
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

                inserted_leadtimes = self.leadtime_repo.bulk_insert(leadtimes_payload)
                created_supplier["leadtimes"] = inserted_leadtimes

            else:
                created_supplier["leadtimes"] = []

            self.audit_service.log(
                action=AuditAction.SUPPLIER_CREATE,
                performed_by=user_id,
                entity="SUPPLIER",
                entity_id=supplier_id,
                extra={"name": name},
            )

            return created_supplier

        except Exception:
            logger.exception("Erro ao criar fornecedor - nome: %s", name)
            raise

    def update_supplier(
        self,
        supplier_id: UUID,
        name: str,
        budget: float,
        start: date,
        end: date,
        leadtimes: Optional[List[dict]] = None,
        user_id: Optional[str] = None,
    ) -> dict:

        logger.info("Atualizando fornecedor - supplier_id: %s", supplier_id)

        try:

            now = datetime.utcnow().isoformat()

            current_data = self.repository.get_by_id(supplier_id)

            if not current_data:
                raise ValueError("Fornecedor não encontrado")

            before_name = current_data.get("name")
            before_budget = current_data.get("budget")
            before_start = current_data.get("start")
            before_end = current_data.get("end")
            current_leadtimes = self.leadtime_repo.list_by_supplier(supplier_id)
            new_lt_map = {str(lt.get("branch_id")): lt.get("leadtime") for lt in (leadtimes or [])}

            after_start = start.isoformat() if start else None
            after_end = end.isoformat() if end else None

            if after_start and after_end and after_start > after_end:
                raise ValueError("Data de término deve ser igual ou posterior à data de início.")

            if before_name != name:
                self.audit_service.log(
                    AuditAction.SUPPLIER_UPDATE,
                    user_id,
                    "SUPPLIER",
                    supplier_id,
                    {"field": "name", "old_value": before_name, "new_value": name},
                )

            if before_budget != budget:
                self.audit_service.log(
                    AuditAction.SUPPLIER_UPDATE,
                    user_id,
                    "SUPPLIER",
                    supplier_id,
                    {"field": "budget", "old_value": before_budget, "new_value": budget},
                )

            if str(before_start) != str(after_start):
                self.audit_service.log(
                    AuditAction.SUPPLIER_UPDATE,
                    user_id,
                    "SUPPLIER",
                    supplier_id,
                    {"field": "start", "old_value": before_start, "new_value": after_start},
                )

            if str(before_end) != str(after_end):
                self.audit_service.log(
                    AuditAction.SUPPLIER_UPDATE,
                    user_id,
                    "SUPPLIER",
                    supplier_id,
                    {"field": "end", "old_value": before_end, "new_value": after_end},
                )

            changes = []

            if before_name != name:
                changes.append(f"nome: {before_name} -> {name}")

            if before_budget != budget:
                changes.append(f"Alteração de orçamento: {before_budget} -> {budget}")

            if str(before_start) != str(after_start):
                changes.append(f"Início: {before_start} -> {after_start}")

            if str(before_end) != str(after_end):
                changes.append(f"Fim: {before_end} -> {after_end}")

            if changes:
                self.history_repo.insert({
                    "supplier_id": str(supplier_id),
                    "budget": before_budget,
                    "start": before_start,
                    "end": before_end,
                    "notes": "; ".join(changes),
                    "created_at": now,
                    "updated_at": now,
                })

            try:
                branches = self.dashboard_repo.get_active_branches() or []
                branches_map = {str(branch.get("branch_id")): branch.get("name") for branch in branches}
            except Exception:
                logger.exception("Erro ao buscar filiais ativas para histórico de fornecedor")
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

                    self.history_repo.insert({
                        "supplier_id": str(supplier_id),
                        "branch_id": branch_id,
                        "leadtime": before_lt,
                        "budget": before_budget,
                        "start": before_start,
                        "end": before_end,
                        "notes": notes_lt,
                        "created_at": now,
                        "updated_at": now,
                    })

            existing_branch_ids = {str(lt.get("branch_id")) for lt in current_leadtimes}
            for branch_id_str, after_lt in new_lt_map.items():
                if branch_id_str not in existing_branch_ids:
                    branch_name = branches_map.get(branch_id_str) or None
                    if branch_name:
                        notes_lt = f"Criação de leadtime filial {branch_name}: None -> {after_lt}"
                    else:
                        notes_lt = f"Criação de leadtime: None -> {after_lt}"

                    self.history_repo.insert({
                        "supplier_id": str(supplier_id),
                        "branch_id": branch_id_str,
                        "leadtime": None,
                        "budget": before_budget,
                        "start": before_start,
                        "end": before_end,
                        "notes": notes_lt,
                        "created_at": now,
                        "updated_at": now,
                    })

            payload = {
                "name": name,
                "budget": budget,
                "start": after_start,
                "end": after_end,
                "updated_at": now,
            }

            updated_supplier = self.repository.update(supplier_id, payload)

            self.leadtime_repo.delete_by_supplier(supplier_id)

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

                inserted_leadtimes = self.leadtime_repo.bulk_insert(leadtimes_payload)
                updated_supplier["leadtimes"] = inserted_leadtimes

            else:
                updated_supplier["leadtimes"] = []

            return updated_supplier

        except Exception:
            logger.exception("Erro ao atualizar fornecedor - supplier_id: %s", supplier_id)
            raise

    def get_supplier_history(self, supplier_id: UUID):

        return self.history_repo.list_by_supplier(supplier_id)

    def deactivate_supplier(self, supplier_id: str, user_id: Optional[str] = None) -> dict:

        try:

            current = self.repository.get_by_id(supplier_id)

            if not current:
                raise ValueError("Fornecedor não encontrado.")

            if not current.get("is_active"):
                raise ValueError("Fornecedor já está desativado.")

            now = datetime.utcnow().isoformat()

            result = self.repository.deactivate(supplier_id, now)

            self.audit_service.log(
                action=AuditAction.SUPPLIER_DELETE,
                performed_by=user_id,
                entity="SUPPLIER",
                entity_id=supplier_id,
                extra={"name": current.get("name")},
            )

            return result

        except Exception:
            logger.exception("Erro ao desativar fornecedor - supplier_id: %s", supplier_id)
            raise