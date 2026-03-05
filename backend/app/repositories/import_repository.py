import logging
import pandas as pd
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class ImportRepository:

    def parse_value(self, value, type_cast=float, default=0):
        if value is None or str(value).strip() == "" or str(value).lower() == 'nan':
            return default
        
        s = str(value).strip()
        s = s.replace('R$', '').replace(' ', '').replace('"', '').replace("'", "")
        
        if not s:
            return default
            
        if s.count(',') > 1:
            s = s.replace(',', '')
        else:
            if ',' in s and '.' in s: s = s.replace('.', '').replace(',', '.')
            elif ',' in s: s = s.replace(',', '.')
            
        try:
            val_float = float(s)
            final_value = type_cast(val_float)
            return final_value if final_value > 0 else 0
        except (ValueError, TypeError):
            logger.debug(f"Falha ao converter valor: {value}")
            return default

    def process_batch(self, batch: list) -> int:
        if not batch:
            return 0

        incoming_data = {}
        unique_brands = set()
        
        for row in batch:
            keys = list(row.keys())
            col_nome = ' ' if ' ' in keys else (keys[0] if keys else 'nome_produto')
            
            nome_produto = str(row.get(col_nome, '')).strip()
            codigo = str(row.get('REFERENCIA', '')).strip()
            marca = str(row.get('MARCA', '')).strip()
            
            if not codigo or codigo.lower() == 'nan':
                continue
            
            if marca and marca.lower() != 'nan':
                unique_brands.add(marca)
            
            unique_key = f"{codigo}|{nome_produto}"
            incoming_data[unique_key] = {
                "codigo": codigo,
                "nome_produto": nome_produto if nome_produto.lower() != 'nan' else 'Item sem nome',
                "marca": marca if marca.lower() != 'nan' and marca != '' else None,
                "classificacao": str(row.get('CLASSIFICACAO', '')).strip(),
                "row": row
            }

        if not incoming_data:
            return 0

        try:
            if unique_brands:
                suppliers_payload = [{"name": b} for b in unique_brands]
                supabase.table("suppliers").upsert(suppliers_payload, on_conflict="name").execute()
            
            res_sups = supabase.table("suppliers").select("supplier_id, name").execute()
            sup_name_to_id = {s['name'].upper(): s['supplier_id'] for s in res_sups.data}

            skus_payload = [
                {
                    "codigo": info["codigo"],
                    "nome_produto": info["nome_produto"],
                    "marca": info["marca"],
                    "classificacao": info["classificacao"] if info["classificacao"].lower() != 'nan' else 'Geral'
                }
                for info in incoming_data.values()
            ]

            res_skus = supabase.table("tb_skus").upsert(
                skus_payload, 
                on_conflict="codigo, nome_produto"
            ).execute()

            if not res_skus.data:
                logger.warning("Nenhum SKU foi inserido ou atualizado no lote.")
                return 0

            key_to_sku_id = {f"{item['codigo']}|{item['nome_produto']}": item['id'] for item in res_skus.data}
            sku_ids = list(key_to_sku_id.values())

            ana_res = supabase.table("tb_analise_compra").select("id", "sku_id").in_("sku_id", sku_ids).execute()
            sku_to_ana_id = {item['sku_id']: item['id'] for item in ana_res.data}

            analises_payload = []
            history_payload = []
            product_suppliers_payload = []

            for key, sku_id in key_to_sku_id.items():
                info = incoming_data[key]
                row = info["row"]
                
                if info["marca"] and info["marca"].upper() in sup_name_to_id:
                    product_suppliers_payload.append({
                        "sku_id": sku_id,
                        "supplier_id": sup_name_to_id[info["marca"].upper()]
                    })

                ana_rec = {
                    "sku_id": sku_id,
                    "demanda_poa": self.parse_value(row.get('DEMANDA_90'), int),
                    "demanda_jv": self.parse_value(row.get('DEMANDA_70'), int),
                    "demanda_sp": self.parse_value(row.get('DEMANDA_10'), int),
                    "demanda_soma": self.parse_value(row.get('DEMANDA_SOMA'), int),
                    "sugestao_compra": self.parse_value(row.get('SUGESTAO_COMPRA_30_DIAS'), int),
                    "estoque_poa": self.parse_value(row.get('ESTOQUE_90'), int),
                    "estoque_jv": self.parse_value(row.get('ESTOQUE_70'), int),
                    "estoque_sp": self.parse_value(row.get('ESTOQUE_10'), int),
                    "estoque_soma": self.parse_value(row.get('ESTOQUE_SOMA'), int),
                    "pendencia_poa": self.parse_value(row.get('PENDENTE_90'), int),
                    "pendencia_jv": self.parse_value(row.get('PENDENTE_70'), int),
                    "pendencia_sp": self.parse_value(row.get('PENDENTE_10'), int),
                    "pendencia_soma": self.parse_value(row.get('PENDENTE_SOMA'), int),
                    "falta_poa": self.parse_value(row.get('FALTA_90'), int),
                    "falta_jv": self.parse_value(row.get('FALTA_70'), int),
                    "falta_sp": self.parse_value(row.get('FALTA_10'), int),
                    "falta_soma": self.parse_value(row.get('FALTA_SOMA'), int),
                    "atendimento": self.parse_value(row.get('ATENDIMENTO'), float),
                    "frequencia": self.parse_value(row.get('FREQUENCIA'), float),
                    "data_importacao": "now()"
                }
                if sku_id in sku_to_ana_id:
                    ana_rec["id"] = sku_to_ana_id[sku_id]
                analises_payload.append(ana_rec)

                qtd_cols = [c for c in row.keys() if str(c).startswith('QTD_')]
                for idx, q_col in enumerate(sorted(qtd_cols), start=1):
                    mes_ano = q_col.replace('QTD_', '')
                    history_payload.append({
                        "sku_id": sku_id,
                        "periodo_sequencia": idx,
                        "quantidade": self.parse_value(row.get(q_col), int),
                        "valor": self.parse_value(row.get(f"VALOR_{mes_ano}"), float)
                    })

            if product_suppliers_payload:
                supabase.table("product_suppliers").upsert(product_suppliers_payload, on_conflict="sku_id, supplier_id").execute()
            
            if analises_payload:
                supabase.table("tb_analise_compra").upsert(analises_payload).execute()
            
            supabase.table("tb_historico_vendas").delete().in_("sku_id", sku_ids).execute()
            if history_payload:
                supabase.table("tb_historico_vendas").insert(history_payload).execute()

            logger.info(f"Lote processado com sucesso: {len(key_to_sku_id)} SKUs sincronizados.")
            return len(key_to_sku_id)

        except Exception as e:
            logger.exception("Erro crítico no processamento do lote de importação no repositório")
            raise e