import logging
from typing import Optional, List
from uuid import UUID
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class SupplierRepository:

    def list_active(self) -> List[dict]:
        try:
            resp = (
                supabase.table("suppliers")
                .select("*")
                .filter("is_active", "eq", True)
                .order("name")
                .execute()
            )
            return resp.data or []

        except Exception:
            logger.exception("Erro ao listar fornecedores ativos")
            return []

    def get_by_id(self, supplier_id: UUID) -> Optional[dict]:
        try:
            resp = (
                supabase.table("suppliers")
                .select("*")
                .filter("supplier_id", "eq", str(supplier_id))
                .single()
                .execute()
            )
            return resp.data

        except Exception:
            logger.exception(
                "Erro ao buscar fornecedor por ID - supplier_id: %s",
                supplier_id,
            )
            return None

    def insert(self, payload: dict) -> dict:
        try:
            resp = supabase.table("suppliers").insert(payload).execute()

            if not resp.data:
                logger.error(
                    "Inserção de fornecedor retornou vazio - nome: %s",
                    payload.get("name"),
                )
                raise RuntimeError("Erro ao inserir fornecedor")

            logger.info(
                "Fornecedor criado com sucesso - nome: %s",
                payload.get("name"),
            )

            return resp.data[0]

        except Exception:
            logger.exception(
                "Erro ao inserir fornecedor - nome: %s",
                payload.get("name"),
            )
            raise

    def update(self, supplier_id: UUID, payload: dict) -> dict:
        try:
            resp = (
                supabase.table("suppliers")
                .update(payload)
                .filter("supplier_id", "eq", str(supplier_id))
                .execute()
            )

            if not resp.data:
                logger.warning(
                    "Tentativa de atualizar fornecedor inexistente - supplier_id: %s",
                    supplier_id,
                )
                raise ValueError("Fornecedor não encontrado")

            logger.info(
                "Fornecedor atualizado - supplier_id: %s",
                supplier_id,
            )

            return resp.data[0]

        except Exception:
            logger.exception(
                "Erro ao atualizar fornecedor - supplier_id: %s",
                supplier_id,
            )
            raise

    def deactivate(self, supplier_id: UUID, now: str) -> dict:
        try:
            resp = (
                supabase.table("suppliers")
                .update({
                    "is_active": False,
                    "updated_at": now
                })
                .filter("supplier_id", "eq", str(supplier_id))
                .execute()
            )

            if not resp.data:
                logger.warning(
                    "Tentativa de desativar fornecedor inexistente - supplier_id: %s",
                    supplier_id,
                )
                raise ValueError("Fornecedor não encontrado")

            logger.info(
                "Fornecedor desativado - supplier_id: %s",
                supplier_id,
            )

            return resp.data[0]

        except Exception:
            logger.exception(
                "Erro ao desativar fornecedor - supplier_id: %s",
                supplier_id,
            )
            raise