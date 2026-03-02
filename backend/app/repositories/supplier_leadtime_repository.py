import logging
from typing import List
from uuid import UUID
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class SupplierLeadtimeRepository:

    def list_by_supplier(self, supplier_id: UUID):
        try:
            response = (
                supabase
                .table("supplier_leadtimes")
                .select("*")
                .eq("supplier_id", str(supplier_id))
                .execute()
            )
            return response.data or []

        except Exception:
            logger.exception(
                "Erro ao buscar leadtimes do fornecedor - supplier_id: %s",
                supplier_id,
            )
            return []

    def delete_by_supplier(self, supplier_id: UUID):
        try:
            supabase.table("supplier_leadtimes")\
                .delete()\
                .eq("supplier_id", str(supplier_id))\
                .execute()

            logger.info(
                "Leadtimes removidos - supplier_id: %s",
                supplier_id,
            )

        except Exception:
            logger.exception(
                "Erro ao deletar leadtimes do fornecedor - supplier_id: %s",
                supplier_id,
            )
            raise

    def bulk_insert(self, leadtimes: List[dict]):
        if not leadtimes:
            return []

        try:
            response = (
                supabase
                .table("supplier_leadtimes")
                .insert(leadtimes)
                .execute()
            )

            if not response.data:
                logger.error(
                    "Bulk insert de leadtimes retornou vazio - supplier_id: %s",
                    leadtimes[0].get("supplier_id"),
                )
                return []

            logger.info(
                "Leadtimes inseridos com sucesso - supplier_id: %s - quantidade: %s",
                leadtimes[0].get("supplier_id"),
                len(response.data),
            )

            return response.data

        except Exception:
            logger.exception(
                "Erro ao inserir leadtimes - supplier_id: %s",
                leadtimes[0].get("supplier_id"),
            )
            raise