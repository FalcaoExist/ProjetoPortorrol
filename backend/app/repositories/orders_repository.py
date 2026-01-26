from app.core.supabase_client import supabase


class OrdersRepository:

    def __init__(self, table: str):
        self.table = table

    def insert_many(self, records: list):
        response = supabase.table(self.table).insert(records).execute()
        return len(response.data)
