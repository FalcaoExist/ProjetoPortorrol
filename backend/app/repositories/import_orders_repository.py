import logging
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class ImportOrdersRepository:

    ALLOWED_TABLES = {"orders_nsk", "orders_timken"}

    def get_all_pos(self):
        try:
            pos_response = supabase.table("purchase_orders").select("order_id").execute()
            return [p["order_id"] for p in pos_response.data] if pos_response.data else []
        except Exception as e:
            return []

    def insert_many(self, table: str, records: list) -> int:
        if not records:
            return 0

        if table not in self.ALLOWED_TABLES:
            raise ValueError(f"Tabela não permitida para importação: {table}")

        try:
            res = supabase.table(table).insert(records).execute()

            if not res.data:
                logger.error(
                    "Inserção sem retorno de dados - tabela: %s - registros: %s",
                    table,
                    len(records),
                )
                raise RuntimeError(f"Falha ao inserir registros na tabela {table}")

            logger.info(
                "Importação concluída - tabela: %s - registros inseridos: %s",
                table,
                len(res.data),
            )

            return len(res.data)

        except Exception:
            logger.exception(
                "Erro ao inserir registros na tabela %s - total registros: %s",
                table,
                len(records),
            )
            raise