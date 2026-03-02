from app.core.supabase_client import supabase
import pandas as pd

class ImportRepository:

    def parse_value(self, value, type_cast=float, default=0):
        if pd.isna(value) or str(value).strip() == "":
            return default
        
        s = str(value).strip()
        s = s.replace('R$', '').replace(' ', '').replace('"', '').replace("'", "")
        
        if not s:
            return default
            
        if s.count(',') > 1:
            s = s.replace(',', '')
        else:
            s = s.replace('.', '').replace(',', '.')
            
        val_float = float(s)
        
        if type_cast == int:
            return int(val_float)
        return val_float

    def save_sku(self, row):
        col_nome = ' ' if ' ' in row.index else row.index[0]
        nome_produto = str(row.get(col_nome, '')).strip()
        codigo = str(row.get('REFERENCIA', '')).strip()
        marca = str(row.get('MARCA', '')).strip()
        classificacao = str(row.get('CLASSIFICACAO', '')).strip()

        if not codigo or codigo.lower() == 'nan':
            return None

        marca_limpa = marca if marca.lower() != 'nan' and marca != '' else None

        sku_payload = {
            "codigo": codigo,
            "nome_produto": nome_produto if nome_produto.lower() != 'nan' else 'Item sem nome',
            "marca": marca_limpa,
            "classificacao": classificacao if classificacao.lower() != 'nan' else 'Geral'
        }

        sku_id = None
        
        res_check = supabase.table("tb_skus").select("id").eq("codigo", codigo).execute()
        if res_check.data:
            sku_id = res_check.data[0]['id']
            supabase.table("tb_skus").update(sku_payload).eq("id", sku_id).execute()
        else:
            res_insert = supabase.table("tb_skus").insert(sku_payload).execute()
            if res_insert.data:
                sku_id = res_insert.data[0]['id']

        if marca_limpa and sku_id:
            supplier_id = None
            
            sup_check = supabase.table("suppliers").select("supplier_id").ilike("name", marca_limpa).execute()
            
            if sup_check.data:
                supplier_id = sup_check.data[0]['supplier_id']
            else:
                sup_insert = supabase.table("suppliers").insert({"name": marca_limpa}).execute()
                if sup_insert.data:
                    supplier_id = sup_insert.data[0]['supplier_id']

            if supplier_id:
                ps_check = supabase.table("product_suppliers").select("id").eq("sku_id", sku_id).eq("supplier_id", supplier_id).execute()
                
                if not ps_check.data:
                    supabase.table("product_suppliers").insert({
                        "sku_id": sku_id,
                        "supplier_id": supplier_id
                    }).execute()

        return sku_id

    def save_analysis(self, row, sku_id):
        analysis_payload = {
            "sku_id": sku_id,
            "demanda_sp": self.parse_value(row.get('DEMANDA_10'), int),
            "demanda_jv": self.parse_value(row.get('DEMANDA_70'), int),
            "demanda_poa": self.parse_value(row.get('DEMANDA_90'), int),
            "demanda_soma": self.parse_value(row.get('DEMANDA_SOMA'), int),
            "sugestao_compra": self.parse_value(row.get('SUGESTAO_COMPRA_30_DIAS'), int),
            "estoque_sp": self.parse_value(row.get('ESTOQUE_10'), int),
            "estoque_jv": self.parse_value(row.get('ESTOQUE_70'), int),
            "estoque_poa": self.parse_value(row.get('ESTOQUE_90'), int),
            "estoque_soma": self.parse_value(row.get('ESTOQUE_SOMA'), int),
            "pendencia_sp": self.parse_value(row.get('PENDENTE_10'), int),
            "pendencia_jv": self.parse_value(row.get('PENDENTE_70'), int),
            "pendencia_poa": self.parse_value(row.get('PENDENTE_90'), int),
            "pendencia_soma": self.parse_value(row.get('PENDENTE_SOMA'), int),
            "falta_sp": self.parse_value(row.get('FALTA_10'), int),
            "falta_jv": self.parse_value(row.get('FALTA_70'), int),
            "falta_poa": self.parse_value(row.get('FALTA_90'), int),
            "falta_soma": self.parse_value(row.get('FALTA_SOMA'), int),
            "atendimento": self.parse_value(row.get('ATENDIMENTO'), float),
            "frequencia": self.parse_value(row.get('FREQUENCIA'), float)
        }
        
        ana_check = supabase.table("tb_analise_compra").select("id").eq("sku_id", sku_id).execute()
        if ana_check.data:
            supabase.table("tb_analise_compra").update(analysis_payload).eq("sku_id", sku_id).execute()
        else:
            supabase.table("tb_analise_compra").insert(analysis_payload).execute()

    def save_history(self, row, sku_id):
        supabase.table("tb_historico_vendas").delete().eq("sku_id", sku_id).execute()

        batch = []
        qtd_cols = [c for c in row.index if str(c).startswith('QTD_')]
        
        seq = 1
        for q_col in qtd_cols:
            mes_ano = q_col.replace('QTD_', '')
            v_col = f"VALOR_{mes_ano}"
            
            q_val = self.parse_value(row.get(q_col), int)
            v_val = self.parse_value(row.get(v_col), float) if v_col in row.index else 0.0

            batch.append({
                "sku_id": sku_id,
                "periodo_sequencia": seq,
                "quantidade": q_val,
                "valor": v_val
            })
            seq += 1

        if batch:
            supabase.table("tb_historico_vendas").insert(batch).execute()