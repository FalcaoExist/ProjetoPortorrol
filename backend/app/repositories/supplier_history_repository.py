import logging
from uuid import UUID
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class SupplierHistoryRepository:

    def insert(self, record: dict):
        try:
            response = (
                supabase
                .table("supplier_history")
                .insert(record)
                .execute()
            )

            if not response.data:
                logger.error(
                    "Inserção de histórico retornou vazio - supplier_id: %s",
                    record.get("supplier_id"),
                )
                return []

            return response.data

        except Exception:
            logger.exception(
                "Erro ao inserir histórico de fornecedor - supplier_id: %s",
                record.get("supplier_id"),
            )
            raise

    def list_by_supplier(self, supplier_id: UUID):
        try:
            response = (
                supabase
                .table("supplier_history")
                .select("*")
                .eq("supplier_id", str(supplier_id))
                .order("created_at", desc=True)
                .execute()
            )

            return response.data or []

        except Exception:
            logger.exception(
                "Erro ao buscar histórico do fornecedor - supplier_id: %s",
                supplier_id,
            )
            return []