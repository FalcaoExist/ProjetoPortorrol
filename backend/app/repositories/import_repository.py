from app.core.supabase_client import supabase

class ImportRepository:

    def parse_value(self, value, type_cast=float, default=0):
        """
        Converte valores para números. Se encontrar texto (como deslocamento de colunas),
        retorna 0 por padrão. Trata símbolos e formatação brasileira.
        """
        if value is None or str(value).strip() == "" or str(value).lower() == 'nan':
            return default
        
        # Limpeza de caracteres não numéricos
        s = str(value).strip()
        s = s.replace('R$', '').replace(' ', '').replace('"', '').replace("'", "")
        
        if not s:
            return default
            
        # Normalização de separadores decimais e de milhar
        if ',' in s:
            if '.' in s: 
                s = s.replace('.', '').replace(',', '.') # 1.234,56 -> 1234.56
            else: 
                s = s.replace(',', '.') # 1234,56 -> 1234.56
        elif s.count('.') > 1:
            s = s.replace('.', '') # 1.000.000 -> 1000000
            
        try:
            val_float = float(s)
            return type_cast(val_float)
        except (ValueError, TypeError):
            # Se for um texto puro (ex: "ANEL DE BLOQUEIO"), retorna 0
            return default

    def process_batch(self, batch: list) -> int:
        """
        Processa o lote de importação. 
        Identifica produtos pelo par (REFERENCIA + NOME) para importar todas as linhas.
        """
        if not batch:
            return 0

        incoming_data = {}
        
        # 1. Organizar dados de entrada usando Chave Composta
        for row in batch:
            keys = list(row.keys())
            # Tenta encontrar a coluna de nome (ajusta para nomes deslocados se necessário)
            col_nome = ' ' if ' ' in keys else (keys[0] if keys else 'nome_produto')
            
            nome_produto = str(row.get(col_nome, '')).strip()
            codigo = str(row.get('REFERENCIA', '')).strip()
            
            if not codigo or codigo.lower() == 'nan':
                continue
            
            # Chave única para preservar itens com mesmo código mas nomes diferentes
            unique_key = f"{codigo}|{nome_produto}"
            incoming_data[unique_key] = {
                "codigo": codigo,
                "nome_produto": nome_produto,
                "marca": str(row.get('MARCA', '')).strip(),
                "classificacao": str(row.get('CLASSIFICACAO', '')).strip(),
                "row": row
            }

        if not incoming_data:
            return 0

        # 2. Upsert dos SKUs (Sincroniza tb_skus)
        # Importante: on_conflict="codigo, nome_produto" deve existir no banco
        skus_payload = [
            {
                "codigo": info["codigo"],
                "nome_produto": info["nome_produto"],
                "marca": info["marca"] if info["marca"].lower() != 'nan' else None,
                "classificacao": info["classificacao"]
            }
            for info in incoming_data.values()
        ]

        res_skus = supabase.table("tb_skus").upsert(
            skus_payload, 
            on_conflict="codigo, nome_produto"
        ).execute()

        if not res_skus.data:
            return 0

        # Mapeia a chave composta para o ID gerado pelo Supabase
        key_to_sku_id = {f"{item['codigo']}|{item['nome_produto']}": item['id'] for item in res_skus.data}
        sku_ids = list(key_to_sku_id.values())

        # 3. Preparar dados para Tabelas Dependentes
        ana_res = supabase.table("tb_analise_compra").select("id", "sku_id").in_("sku_id", sku_ids).execute()
        sku_to_ana_id = {item['sku_id']: item['id'] for item in ana_res.data}

        analises_payload = []
        history_payload = []

        for key, sku_id in key_to_sku_id.items():
            row = incoming_data[key]["row"]
            
            # Montagem do payload de Análise de Compra
            ana_rec = {
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
            if sku_id in sku_to_ana_id:
                ana_rec["id"] = sku_to_ana_id[sku_id]
            analises_payload.append(ana_rec)

            # Montagem do Histórico de Vendas
            qtd_cols = [c for c in row.keys() if str(c).startswith('QTD_')]
            for idx, q_col in enumerate(sorted(qtd_cols), start=1):
                mes_ano = q_col.replace('QTD_', '')
                q_val = self.parse_value(row.get(q_col), int)
                v_val = self.parse_value(row.get(f"VALOR_{mes_ano}"), float)
                
                if q_val != 0 or v_val != 0:
                    history_payload.append({
                        "sku_id": sku_id,
                        "periodo_sequencia": idx,
                        "quantidade": q_val,
                        "valor": v_val
                    })

        # 4. Gravação Final
        if analises_payload:
            supabase.table("tb_analise_compra").upsert(analises_payload).execute()
        
        # Limpa histórico antigo apenas dos itens que estão sendo atualizados agora
        supabase.table("tb_historico_vendas").delete().in_("sku_id", sku_ids).execute()
        if history_payload:
            supabase.table("tb_historico_vendas").insert(history_payload).execute()

        return len(key_to_sku_id)