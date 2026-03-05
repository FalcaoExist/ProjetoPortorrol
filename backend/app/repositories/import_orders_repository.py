from app.core.supabase_client import supabase

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
                raise RuntimeError(f"Falha ao inserir registros na tabela {table}")

            return len(res.data)

        except Exception as e:
            raise RuntimeError(
                f"Erro ao inserir registros na tabela {table}: {str(e)}"
            )