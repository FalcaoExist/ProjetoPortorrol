import pandas as pd
from app.repositories.pedidos_repository import PedidosRepository

# helpers (obrigatórios para JSON / Supabase)

def parse_date(value):
    if pd.isna(value):
        return None

    if isinstance(value, pd.Timestamp):
        return value.date().isoformat()

    if hasattr(value, "isoformat"):
        return value.isoformat()

    return value

def parse_int(value):
    if pd.isna(value):
        return None
    return int(value)


def parse_float(value):
    if pd.isna(value):
        return None
    return float(value)

def clean_record(record: dict) -> dict:
    cleaned = {}

    for key, value in record.items():
        if pd.isna(value):
            cleaned[key] = None
        elif hasattr(value, "item"):  # numpy types
            cleaned[key] = value.item()
        else:
            cleaned[key] = value

    return cleaned

class ImportPedidosService:

    async def importar(self, fornecedor: str, file):
        df = pd.read_excel(file.file)
        fornecedor = fornecedor.lower()

        if fornecedor == "nsk":
            records = self._map_nsk(df)
            table = "orders_nsk"

        elif fornecedor == "timken":
            records = self._map_timken(df)
            table = "orders_timken"

        else:
            raise ValueError("Fornecedor não suportado")

        records = [
            clean_record(r)
            for r in records
            if any(v is not None for v in r.values())
        ]

        if not records:
            raise ValueError("Arquivo não contém registros válidos para importação")
    
        repo = PedidosRepository(table)
        return repo.insert_many(records)
    
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
                "data_solicitada": parse_date(row.get("Data Solicitada (DD/MM/AAAA)")),
                "data_entrega": parse_date(row.get("Data Entrega (DD/MM/AAAA)")),
                "qtd_solicitada": parse_int(row.get("Qtd Solicitada")),
                "qtd_confirmada": parse_int(row.get("Qtde Confirmada")),
                "qtd_faturada": parse_int(row.get("Qtde Faturada")),
                "preco_unitario": parse_float(row.get("Preço Unitário")),
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
                "item": parse_int(row.get("Item")),
                "po_header": row.get("Header PO number"),
                "po_number": row.get("Purchase order number"),
                "material": row.get("Material"),
                "descricao": row.get("Material full Description"),
                "material_cliente": row.get("Customer Material Number"),
                "qtd_confirmada": parse_int(row.get("Confirmed Qty")),
                "data_solicitada": parse_date(row.get("Requested date")),
                "data_confirmada": parse_date(row.get("Confirmed date")),
                "open_qty": parse_int(row.get("Open Qty")),
                "preco_unitario": parse_float(row.get("Sales unit price")),
                "status": row.get("Status"),
                "nc_nr": row.get("NC/NR"),
            })

        return records
