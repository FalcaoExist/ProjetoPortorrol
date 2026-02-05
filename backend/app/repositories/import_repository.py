import io

import pandas as pd

from app.core.supabase_client import supabase


def parse_value(value, type_cast=float, default=0):
    """
    Função Mestre: Trata float, int e corrige formatação BR/US.
    """
    if pd.isna(value) or str(value).strip() == "":
        return default
    try:
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
    except Exception:
        return default

def parse_percentage(value):
    try:
        if pd.isna(value) or str(value).strip() == "":
            return 0.0
        s = str(value).strip().replace('%', '').replace('"', '').replace("'", "").replace(' ', '')
        if '.' in s and ',' in s:
            s = s.replace('.', '').replace(',', '.')
        else:
            s = s.replace(',', '.')
        return float(s)
    except:
        return 0.0

def get_value_by_name(row, possible_names):
    if isinstance(possible_names, str):
        possible_names = [possible_names]
    column_map = {str(c).strip().upper(): c for c in row.index}
    for target_name in possible_names:
        key = str(target_name).strip().upper()
        if key in column_map:
            real_col = column_map[key]
            return row[real_col]
    return 0

def log_error(line, reason, row_data=None):
    try:
        dados_str = str(row_data)
        if hasattr(row_data, 'to_dict'):
            dados_str = str(row_data.to_dict())

        if len(dados_str) > 3000:
            dados_str = dados_str[:3000] + "..."

        print(f"[IMPORT][ROW ERROR] line={line} reason={reason} data={dados_str}")
    except Exception as e:
        print(f"Falha ao registrar erro técnico da linha {line}: {e}")

def log_global(file_name, error_msg):
    try:
        print(f"[IMPORT][FILE ERROR] file={file_name} error={error_msg}")
    except Exception as e:
        print(f"Falha ao registrar erro técnico global: {e}")

def save_sku(row):
    code = str(get_value_by_name(row, ['CODIGO', 'REFERENCIA', 'SKU']) or row.iloc[1]).strip()
    if not code or code.lower() in ['nan', 'sku', 'codigo', 'code', '0']:
        return None
    name = str(get_value_by_name(row, ['NOME_PRODUTO', 'DESCRIÇÃO', 'DESCRICAO']) or row.iloc[0]).strip()
    brand = str(get_value_by_name(row, ['MARCA', 'FABRICANTE']) or row.iloc[2]).strip()
    classification = str(get_value_by_name(row, ['CLASSIFICACAO', 'CURVA']) or "REGULAR").strip()
    product_data = {
        "nome_produto": name,
        "codigo": code,
        "marca": brand,
        "classificacao": classification
    }
    try:
        res = supabase.table("tb_skus").upsert(product_data, on_conflict="codigo").execute()
        if res.data:
            return res.data[0]['id']
        search = supabase.table("tb_skus").select("id").eq("codigo", code).execute()
        if search.data:
            return search.data[0]['id']
    except Exception as e:
        print(f"Erro SKU {code}: {e}")
    return None

def save_analysis(row, sku_id):

    try:
        supabase.table("tb_analise_compra").delete().eq("sku_id", sku_id).execute()
        data = {
            "sku_id": sku_id,
            "demanda_jv":   parse_value(get_value_by_name(row, ["DEMANDA_10", "DEMANDA_JV"]), type_cast=int),
            "demanda_sp":   parse_value(get_value_by_name(row, ["DEMANDA_70", "DEMANDA_SP"]), type_cast=int),
            "demanda_poa":  parse_value(get_value_by_name(row, ["DEMANDA_90", "DEMANDA_POA"]), type_cast=int),
            "demanda_soma": parse_value(get_value_by_name(row, ["DEMANDA_SOMA", "TOTAL_DEMANDA"]), type_cast=int),
            "sugestao_compra": parse_value(get_value_by_name(row, ["SUGESTAO_COMPRA_30_DIAS", "SUGESTAO"]), type_cast=int),
            "estoque_jv":   parse_value(get_value_by_name(row, ["ESTOQUE_10", "ESTOQUE_JV"]), type_cast=int),
            "estoque_sp":   parse_value(get_value_by_name(row, ["ESTOQUE_70", "ESTOQUE_SP"]), type_cast=int),
            "estoque_poa":  parse_value(get_value_by_name(row, ["ESTOQUE_90", "ESTOQUE_POA"]), type_cast=int),
            "estoque_soma": parse_value(get_value_by_name(row, ["ESTOQUE_SOMA", "TOTAL_ESTOQUE"]), type_cast=int),
            "pendencia_jv":   parse_value(get_value_by_name(row, ["PENDENTE_10", "PENDENCIA_JV"]), type_cast=int),
            "pendencia_sp":   parse_value(get_value_by_name(row, ["PENDENTE_70", "PENDENCIA_SP"]), type_cast=int),
            "pendencia_poa":  parse_value(get_value_by_name(row, ["PENDENTE_90", "PENDENCIA_POA"]), type_cast=int),
            "pendencia_soma": parse_value(get_value_by_name(row, ["PENDENCIA_SOMA", "TOTAL_PENDENCIA"]), type_cast=int),
            "falta_jv":   parse_value(get_value_by_name(row, ["FALTA_10", "RUPTURA_JV"]), type_cast=int),
            "falta_sp":   parse_value(get_value_by_name(row, ["FALTA_70", "RUPTURA_SP"]), type_cast=int),
            "falta_poa":  parse_value(get_value_by_name(row, ["FALTA_90", "RUPTURA_POA"]), type_cast=int),
            "falta_soma": parse_value(get_value_by_name(row, ["FALTA_SOMA", "TOTAL_FALTA"]), type_cast=int),
            "falta_soma_total": 0,
            "atendimento": parse_percentage(get_value_by_name(row, ["ATENDIMENTO", "NIVEL_SERVICO"])),
            "frequencia":  parse_percentage(get_value_by_name(row, ["FREQUENCIA", "FREQ"])),
        }
        supabase.table("tb_analise_compra").insert(data).execute()
    except Exception as e:
        print(f"Analysis error SKU {sku_id}: {e}")
        try:
            log_error(sku_id, f"Fatal Insert Analysis Error: {str(e)}", None, str(data))
        except:
            pass

def save_history(row, sku_id):
    try:
        supabase.table("tb_historico_vendas").delete().eq("sku_id", sku_id).execute()
        start_idx = -1
        columns = row.index.tolist()
        for i, col_name in enumerate(columns):
            s_col = str(col_name).upper()
            if "QTD" in s_col and ("/" in s_col or "_" in s_col):
                if i+1 < len(columns) and "VALOR" in str(columns[i+1]).upper():
                    start_idx = i
                    break
        if start_idx == -1:
            start_idx = 4
        batch = []
        current_idx = start_idx
        for seq in range(1, 26):
            if current_idx + 1 >= len(row):
                break
            q = parse_value(row.iloc[current_idx], type_cast=int)
            v = parse_value(row.iloc[current_idx+1], type_cast=float)
            if q != 0 or v != 0:
                batch.append({
                    "sku_id": sku_id,
                    "periodo_sequencia": seq,
                    "quantidade": q,
                    "valor": v
                })
            current_idx += 2
        if batch:
            supabase.table("tb_historico_vendas").insert(batch).execute()
    except Exception as e:
        print(f"Erro Histórico SKU {sku_id}: {e}")


def process_import_file(file_content, user_id=None):
    print(">>> Iniciando leitura do CSV...")
    
    try:
        df = pd.read_csv(io.BytesIO(file_content), sep=None, engine='python', dtype=str)
        df.dropna(how='all', inplace=True)
        
        print(f">>> CSV Lido. Colunas: {len(df.columns)}")
        
        total_sucessos = 0
        total_erros = 0

        for index, row in df.iterrows():
            try:
                # Tenta salvar o SKU
                sku_id = save_sku(row)
                if sku_id:
                    save_analysis(row, sku_id)
                    save_history(row, sku_id)
                    total_sucessos += 1
                else:
                    total_erros += 1
                    error_msg = "SKU não identificado, inválido ou erro ao salvar produto (verifique logs do console)"
                    attempted_code = str(get_value_by_name(row, ['CODIGO', 'REFERENCIA', 'SKU']) or "DESCONHECIDO")
                    error_msg += f" - Código tentado: {attempted_code}"
                    log_error(
                        line=index + 2,
                        reason=error_msg,
                        user_id=user_id,
                        row_data=row
                    )

            except Exception as e:
                # CORREÇÃO 2: Este bloco pega erros gerais do loop (ex: falha no salvar_analise que não foi tratada)
                print(f"Erro linha {index}: {e}")
                total_erros += 1
                log_error(
                    line=index + 2,
                    reason=str(e),
                    user_id=user_id,
                    row_data=row
                )

        return {"status": "success", "processed": total_sucessos, "errors": total_erros}

    except Exception as e:
        print(f"CRÍTICO - Falha ao abrir CSV: {e}")
        log_global("UPLOAD_CSV", str(e), user_id)
        raise e