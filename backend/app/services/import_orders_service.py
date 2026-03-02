import pandas as pd
from app.repositories.import_orders_repository import ImportOrdersRepository
from app.repositories.repositories_supabase import SupabaseUserRepository

class ImportOrdersService:

    def _parse_date(self, value):
        if pd.isna(value):
            return None

        if isinstance(value, pd.Timestamp):
            return value.date().isoformat()

        if hasattr(value, "isoformat"):
            return value.isoformat()

        return value

    def _parse_int(self, value):
        if pd.isna(value):
            return None
        return int(value)

    def _parse_float(self, value):
        if pd.isna(value):
            return None
        return float(value)

    def _clean_record(self, record: dict) -> dict:
        cleaned = {}
        for key, value in record.items():
            if pd.isna(value):
                cleaned[key] = None
            elif hasattr(value, "item"):
                cleaned[key] = value.item()
            else:
                cleaned[key] = value
        return cleaned

    # IMPORTAÇÃO

    async def import_file(self, supplier: str, file):
        user_repo = SupabaseUserRepository()
        repo = ImportOrdersRepository()

        df = pd.read_excel(file.file)
        supplier = supplier.lower()

        if supplier == "nsk":
            records = self._map_nsk(df)
            table = "orders_nsk"

        elif supplier == "timken":
            records = self._map_timken(df)
            table = "orders_timken"

        else:
            raise ValueError("Fornecedor não suportado")

        records = [
            self._clean_record(r)
            for r in records
            if any(v is not None and v != "" for v in r.values())
        ]

        if not records:
            return 0

        result = repo.insert_many(table, records)
        return result

    # NSK

    def _map_nsk(self, df):
        records = []

        for _, row in df.iterrows():
            records.append({
                "pedido_cliente": row.get("Ped. Cli."),
                "pedido_item": row.get("Ped. Item"),
                "codigo_cliente": row.get("Código Cliente"),
                "pedido_nsk": row.get("Ped. NSK"),
                "produto": row.get("Unnamed: 4"),
                "data_solicitada": self._parse_date(row.get("Data Solicitada (DD/MM/AAAA)")),
                "data_entrega": self._parse_date(row.get("Data Entrega (DD/MM/AAAA)")),
                "qtd_solicitada": self._parse_int(row.get("Qtd Solicitada")),
                "qtd_confirmada": self._parse_int(row.get("Qtde Confirmada")),
                "qtd_faturada": self._parse_int(row.get("Qtde Faturada")),
                "preco_unitario": self._parse_float(row.get("Preço Unitário")),
                "nota_fiscal": row.get("Nº Nota Fiscal"),
                "transportadora": row.get("Transportadora"),
            })

        return records

    # TIMKEN

    def _map_timken(self, df):
        records = []

        for _, row in df.iterrows():
            records.append({
                "sold_to": row.get("Sold-to party"),
                "cliente": row.get("Name 1"),
                "sales_doc": row.get("Sales Doc."),
                "item": self._parse_int(row.get("Item")),
                "po_header": row.get("Header PO number"),
                "po_number": row.get("Purchase order number"),
                "material": row.get("Material"),
                "descricao": row.get("Material full Description"),
                "material_cliente": row.get("Customer Material Number"),
                "qtd_confirmada": self._parse_int(row.get("Confirmed Qty")),
                "data_solicitada": self._parse_date(row.get("Requested date")),
                "data_confirmada": self._parse_date(row.get("Confirmed date")),
                "open_qty": self._parse_int(row.get("Open Qty")),
                "preco_unitario": self._parse_float(row.get("Sales unit price")),
                "status": row.get("Status"),
                "nc_nr": row.get("NC/NR"),
            })

        return records