from app.core.supabase_client import supabase

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
            return type_cast(val_float)
        except ValueError:
            return default

    def save_sku(self, row: dict):
        keys = list(row.keys())
        
        col_nome = ' ' if ' ' in keys else (keys[0] if keys else 'nome_produto')
        
        nome_produto = str(row.get(col_nome, '')).strip()
        codigo = str(row.get('REFERENCIA', '')).strip()
        marca = str(row.get('MARCA', '')).strip()
        classificacao = str(row.get('CLASSIFICACAO', '')).strip()

        if not codigo or codigo.lower() == 'nan':
            return None

        marca_limpa = marca if marca.lower() != 'nan' and marca != '' else None

        sku_check = supabase.table("tb_skus").select("id").eq("codigo", codigo).execute()
        
        if sku_check.data:
            sku_id = sku_check.data[0]['id']
            supabase.table("tb_skus").update({
                "nome_produto": nome_produto,
                "marca": marca_limpa,
                "classificacao": classificacao
            }).eq("id", sku_id).execute()
        else:
            res = supabase.table("tb_skus").insert({
                "codigo": codigo,
                "nome_produto": nome_produto,
                "marca": marca_limpa,
                "classificacao": classificacao
            }).execute()
            if res.data:
                sku_id = res.data[0]['id']
            else:
                return None
            
        return sku_id

    def save_analysis(self, row: dict, sku_id: int):
        analysis_payload = {
            "sku_id": sku_id,
            "demanda_poa": self.parse_value(row.get('DEMANDA_10'), int),
            "demanda_jv": self.parse_value(row.get('DEMANDA_70'), int),
            "demanda_sp": self.parse_value(row.get('DEMANDA_90'), int),
            "demanda_soma": self.parse_value(row.get('DEMANDA_SOMA'), int),
            
            "sugestao_compra": self.parse_value(row.get('SUGESTAO_COMPRA_30_DIAS'), int),
            
            "estoque_poa": self.parse_value(row.get('ESTOQUE_10'), int),
            "estoque_jv": self.parse_value(row.get('ESTOQUE_70'), int),
            "estoque_sp": self.parse_value(row.get('ESTOQUE_90'), int),
            "estoque_soma": self.parse_value(row.get('ESTOQUE_SOMA'), int),
            
            "pendencia_poa": self.parse_value(row.get('PENDENTE_10'), int),
            "pendencia_jv": self.parse_value(row.get('PENDENTE_70'), int),
            "pendencia_sp": self.parse_value(row.get('PENDENTE_90'), int),
            "pendencia_soma": self.parse_value(row.get('PENDENTE_SOMA'), int),
            
            "falta_poa": self.parse_value(row.get('FALTA_10'), int),
            "falta_jv": self.parse_value(row.get('FALTA_70'), int),
            "falta_sp": self.parse_value(row.get('FALTA_90'), int),
            "falta_soma": self.parse_value(row.get('FALTA_SOMA'), int),
            
            "atendimento": self.parse_value(row.get('ATENDIMENTO'), float),
            "frequencia": self.parse_value(row.get('FREQUENCIA'), float),
            "data_importacao": "now()"
        }
        
        ana_check = supabase.table("tb_analise_compra").select("id").eq("sku_id", sku_id).execute()
        if ana_check.data:
            supabase.table("tb_analise_compra").update(analysis_payload).eq("sku_id", sku_id).execute()
        else:
            supabase.table("tb_analise_compra").insert(analysis_payload).execute()

    def save_history(self, row: dict, sku_id: int):
        supabase.table("tb_historico_vendas").delete().eq("sku_id", sku_id).execute()

        batch = []
        qtd_cols = [c for c in row.keys() if str(c).startswith('QTD_')]
        
        qtd_cols.sort()

        for idx, q_col in enumerate(qtd_cols, start=1):
            mes_ano = q_col.replace('QTD_', '')
            v_col = f"VALOR_{mes_ano}"
            
            q_val = self.parse_value(row.get(q_col), int)
            v_val = self.parse_value(row.get(v_col), float)
            
            if q_val != 0 or v_val != 0:
                batch.append({
                    "sku_id": sku_id,
                    "periodo_sequencia": idx,
                    "quantidade": q_val,
                    "valor": v_val
                })
            
        if batch:
            supabase.table("tb_historico_vendas").insert(batch).execute()