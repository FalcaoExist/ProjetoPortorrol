import io
import logging
import math
import pandas as pd
import numpy as np
from datetime import datetime
from app.repositories.import_orders_repository import ImportOrdersRepository
from app.audit.audit_actions import AuditAction
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

class ImportOrdersService:

    def __init__(self, audit_service: AuditService):
        self.repo = ImportOrdersRepository()
        self.audit_service = audit_service


    def _parse_date(self, value):
        if pd.isna(value) or str(value).strip().lower() in ["", "nan", "null", "nat"]:
            return None

        try:
            if isinstance(value, (pd.Timestamp, datetime)):
                return value.strftime('%Y-%m-%d')

            if hasattr(value, "isoformat"):
                return value.isoformat()[:10]

            s = str(value).strip().split(' ')[0].replace('/', '-')

            if len(s) >= 10 and s[2] == '-':
                p = s.split('-')
                return f"{p[2]}-{p[1]}-{p[0]}"

            if len(s) >= 10 and s[4] == '-':
                return s[:10]

            return s

        except Exception:
            return None


    def _parse_num(self, value, is_float=False):

        if pd.isna(value) or value is None:
            return 0.0 if is_float else 0

        if isinstance(value, (int, float, np.number)):
            val = float(value)

            if math.isnan(val) or math.isinf(val):
                return 0.0 if is_float else 0

            return val if is_float else int(val)

        try:
            s = str(value).replace('R$', '').replace(' ', '').strip()

            if ',' in s:
                s = s.replace('.', '').replace(',', '.')

            val = float(s)

            if math.isnan(val) or math.isinf(val):
                return 0.0 if is_float else 0

            result = val if val >= 0 else 0.0

            return result if is_float else int(result)

        except (ValueError, TypeError):
            return 0.0 if is_float else 0


    def _safe_str(self, val):
        if pd.isna(val) or val is None:
            return None

        s = str(val).strip()

        return None if s.lower() in ["nan", "none", "null", "", "nat"] else s


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


    def get_col(self, row, possible_names):

        row_keys_upper = {str(k).replace(" ", "").upper(): k for k in row.keys()}

        for name in possible_names:

            name_clean = str(name).replace(" ", "").upper()

            if name_clean in row_keys_upper:
                return row[row_keys_upper[name_clean]]

        return None


    async def import_file(self, supplier: str, file, user_id: str = None):

        logger.info("Iniciando importação de pedidos - fornecedor: %s", supplier)

        supplier_key = supplier.lower()

        try:
            await file.seek(0)
            content = await file.read()

            df = pd.read_excel(io.BytesIO(content), engine='openpyxl')

            if supplier_key == "timken":

                cols_upper = [str(c).upper().replace(" ", "") for c in df.columns]

                if "PURCHASEORDERNUMBER" not in cols_upper:
                    df = pd.read_excel(io.BytesIO(content), engine='openpyxl', header=1)

            df.columns = [str(c).replace('\n', ' ').strip() for c in df.columns]

        except Exception as e:

            logger.exception("Erro ao ler arquivo Excel para fornecedor: %s", supplier)

            self.audit_service.log(
                action=AuditAction.IMPORT_FAILURE,
                performed_by=user_id,
                entity="ORDER_IMPORT",
                entity_id=supplier,
                extra={"error": str(e)},
            )

            raise ValueError(f"Erro ao processar o Excel: {str(e)}")

        if supplier_key not in ["nsk", "timken"]:

            logger.warning("Tentativa de importação para fornecedor não suportado: %s", supplier)

            raise ValueError("Fornecedor não suportado")


        records = []

        try:
            all_pos = self.repo.get_all_pos()

        except Exception as e:
            logger.error(f"Erro ao buscar POs para vínculo: {e}")
            all_pos = []


        def find_po(ref_text):

            val = str(ref_text).strip().upper()

            if not val or val in ["NAN", "NULL", "NONE"]:
                return None

            ref_clean = val.replace('MAN-', '').split('-')[0].strip()

            for po in all_pos:

                if ref_clean in str(po).upper():
                    return po

            return None


        for _, row in df.iterrows():

            if supplier_key == "nsk":

                ped_cli = self._safe_str(self.get_col(row, ["Ped. Cli.", "Ped.Cli."]))

                if not ped_cli:
                    continue

                records.append({
                    "ped_cli": ped_cli,
                    "ped_item": self._safe_str(self.get_col(row, ["Ped. Item"])),
                    "codigo_cliente": self._safe_str(self.get_col(row, ["Código Cliente"])),
                    "ped_nsk": self._safe_str(self.get_col(row, ["Ped. NSK"])),
                    "produto": self._safe_str(self.get_col(row, ["Produto", "Unnamed: 4"])) or "N/A",
                    "data_solicitada": self._parse_date(self.get_col(row, ["Data Solicitada (DD/MM/AAAA)"])),
                    "data_entrega": self._parse_date(self.get_col(row, ["Data Entrega (DD/MM/AAAA)"])),
                    "qtd_solicitada": self._parse_num(self.get_col(row, ["Qtd Solicitada"])),
                    "qtde_nao_aceita": self._parse_num(self.get_col(row, ["Qtde não aceita"])),
                    "em_analise": self._parse_num(self.get_col(row, ["Em Análise"])),
                    "qtde_confirmada": self._parse_num(self.get_col(row, ["Qtde Confirmada"])),
                    "qtde_reservada": self._parse_num(self.get_col(row, ["Qtde Reservada"])),
                    "qtde_em_separacao": self._parse_num(self.get_col(row, ["Qtde em separação"])),
                    "qtde_faturada": self._parse_num(self.get_col(row, ["Qtde Faturada"])),
                    "preco_unitario": self._parse_num(self.get_col(row, ["Preço Unitário"]), True),
                    "n_nota_fiscal": self._safe_str(self.get_col(row, ["Nº Nota Fiscal"])),
                    "transportadora": self._safe_str(self.get_col(row, ["Transportadora"])),
                    "purchase_order_id": find_po(ped_cli),
                })


            elif supplier_key == "timken":

                po_ref = self._safe_str(self.get_col(row, ["Purchase order number"]))

                if not po_ref:
                    continue

                records.append({
                    "sold_to_party": self._safe_str(self.get_col(row, ["Sold-to party"])),
                    "name_1": self._safe_str(self.get_col(row, ["Name 1"])),
                    "sales_doc": self._safe_str(self.get_col(row, ["Sales Doc."])),
                    "item": self._parse_num(self.get_col(row, ["Item"])),
                    "header_po_number": self._safe_str(self.get_col(row, ["Header PO number"])),
                    "purchase_order_number": po_ref,
                    "po_item": self._safe_str(self.get_col(row, ["POItem"])),
                    "material": self._safe_str(self.get_col(row, ["Material"])),
                    "material_full_description": self._safe_str(self.get_col(row, ["Material full Description"])),
                    "customer_material_number": self._safe_str(self.get_col(row, ["Customer Material Number"])),
                    "confirmed_qty": self._parse_num(self.get_col(row, ["Confirmed Qty"])),
                    "requested_date": self._parse_date(self.get_col(row, ["Requested date"])),
                    "confirmed_date": self._parse_date(self.get_col(row, ["Confirmed date"])),
                    "dn_number": self._safe_str(self.get_col(row, ["DN number"])),
                    "delivery_date": self._parse_date(self.get_col(row, ["Delivery.Date"])),
                    "open_qty": self._parse_num(self.get_col(row, ["Open Qty"])),
                    "status": self._safe_str(self.get_col(row, ["Status"])),
                    "sales_unit_price": self._parse_num(self.get_col(row, ["Sales unit price"]), True),
                    "strategic_grp_desc": self._safe_str(self.get_col(row, ["Strategic Grp Desc"])),
                    "product_allocation": self._safe_str(self.get_col(row, ["Product allocation"])),
                    "nc_nr": self._safe_str(self.get_col(row, ["NC/NR"])),
                    "purchase_order_id": find_po(po_ref),
                })


        records = [
            self._clean_record(r)
            for r in records
            if any(v is not None and v != "" for v in r.values())
        ]


        if not records:
            logger.info("Importação concluída - nenhum registro válido encontrado - fornecedor: %s", supplier)
            return 0


        try:

            lote_size = 500
            total_inserido = 0
            table = f"orders_{supplier_key}"

            for i in range(0, len(records), lote_size):

                lote = records[i:i + lote_size]
                total_inserido += self.repo.insert_many(table, lote)

            logger.info(
                "Importação concluída com sucesso - fornecedor: %s - registros inseridos: %d",
                supplier,
                total_inserido,
            )

            self.audit_service.log(
                action=AuditAction.IMPORT_SUCCESS,
                performed_by=user_id,
                entity="ORDER_IMPORT",
                entity_id=supplier,
                extra={"rows": total_inserido},
            )

            return total_inserido

        except Exception as e:

            logger.exception("Erro ao inserir registros na tabela %s", table)

            self.audit_service.log(
                action=AuditAction.IMPORT_FAILURE,
                performed_by=user_id,
                entity="ORDER_IMPORT",
                entity_id=supplier,
                extra={"error": str(e)},
            )

            raise