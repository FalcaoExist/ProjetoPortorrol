import pandas as pd
import io
from app.core.supabase_client import supabase


def tratar_valor(valor, tipo=float, default=0):
    """
    Função Mestre: Trata float, int e corrige formatação BR/US.
    """
    if pd.isna(valor) or str(valor).strip() == "":
        return default
    
    try:
        s = str(valor).strip()
        # Limpeza pesada
        s = s.replace('R$', '').replace(' ', '').replace('"', '').replace("'", "")

        if not s: return default

        # Lógica de Pontuação (Milhar vs Decimal)
        if s.count(',') > 1:
            s = s.replace(',', '') # Remove milhar "1,000,000"
        else:
            s = s.replace('.', '').replace(',', '.') # Padrão BR "1.000,00" -> "1000.00"

        val_float = float(s)
        
        # SE O TIPO FOR INT, REMOVE O PONTO DECIMAL EXPLICITAMENTE
        if tipo == int:
            return int(val_float)
            
        return val_float

    except Exception:
        return default

def tratar_porcentagem(valor):
    try:
        if pd.isna(valor) or str(valor).strip() == "": return 0.0
        s = str(valor).strip().replace('%', '').replace('"', '').replace("'", "").replace(' ', '')
        
        if '.' in s and ',' in s:
            s = s.replace('.', '').replace(',', '.')
        else:
            s = s.replace(',', '.')
            
        return float(s)
    except:
        return 0.0

def obter_valor_por_nome(row, lista_nomes_possiveis):
    if isinstance(lista_nomes_possiveis, str):
        lista_nomes_possiveis = [lista_nomes_possiveis]

    mapa_colunas = {str(c).strip().upper(): c for c in row.index}

    for nome_alvo in lista_nomes_possiveis:
        chave = str(nome_alvo).strip().upper()
        if chave in mapa_colunas:
            coluna_real = mapa_colunas[chave]
            return row[coluna_real]
            
    return 0 


def registrar_log_erro(linha, motivo, user_id=None, row_data=None):
    try:
        dados_str = str(row_data)
        if hasattr(row_data, 'to_dict'):
            dados_str = str(row_data.to_dict())
            
        if len(dados_str) > 3000: dados_str = dados_str[:3000] + "..."

        payload = {
            "action": "ERRO_IMPORTACAO",
            "entity": "DATA_ROW",
            "entity_id": str(linha),
            "user_id": user_id,
            "extra": {
                "motivo": str(motivo),
                "dados": dados_str
            }
        }
        if not user_id: del payload["user_id"]
        
        supabase.table("audit_logs").insert(payload).execute()
    except:
        print(f"Falha ao registrar log de erro na linha {linha}")

def registrar_log_global(nome_arquivo, erro_msg, user_id):
    try:
        payload = {
            "action": "FALHA_ARQUIVO_TOTAL",
            "entity": "IMPORT_FILE",
            "entity_id": nome_arquivo,
            "user_id": user_id,
            "extra": {
                "erro_critico": str(erro_msg),
                "status": "ABORTADO"
            }
        }
        if not user_id: del payload["user_id"]

        supabase.table("audit_logs").insert(payload).execute()
    except Exception as e:
        print(f"CRÍTICO: Falha ao salvar log global: {e}")


def salvar_sku(row):
    codigo = str(obter_valor_por_nome(row, ['CODIGO', 'REFERENCIA', 'SKU']) or row.iloc[1]).strip()
    
    if not codigo or codigo.lower() in ['nan', 'sku', 'codigo', 'code', '0']:
        return None

    nome = str(obter_valor_por_nome(row, ['NOME_PRODUTO', 'DESCRIÇÃO', 'DESCRICAO']) or row.iloc[0]).strip()
    marca = str(obter_valor_por_nome(row, ['MARCA', 'FABRICANTE']) or row.iloc[2]).strip()
    classificacao = str(obter_valor_por_nome(row, ['CLASSIFICACAO', 'CURVA']) or "REGULAR").strip()

    dados_produto = {
        "nome_produto": nome,
        "codigo": codigo,
        "marca": marca,
        "classificacao": classificacao
    }

    try:
        res = supabase.table("tb_skus").upsert(dados_produto, on_conflict="codigo").execute()
        if res.data: return res.data[0]['id']
        
        busca = supabase.table("tb_skus").select("id").eq("codigo", codigo).execute()
        if busca.data: return busca.data[0]['id']
        
    except Exception as e:
        print(f"Erro SKU {codigo}: {e}")
    
    return None

def salvar_analise(row, sku_id):

    try:
        supabase.table("tb_analise_compra").delete().eq("sku_id", sku_id).execute()

        dados = {
            "sku_id": sku_id,
            
            # --- DEMANDAS (Agora INT, pois o banco é int4) ---
            "demanda_jv":   tratar_valor(obter_valor_por_nome(row, ["DEMANDA_10", "DEMANDA_JV"]), tipo=int),
            "demanda_sp":   tratar_valor(obter_valor_por_nome(row, ["DEMANDA_70", "DEMANDA_SP"]), tipo=int),
            "demanda_poa":  tratar_valor(obter_valor_por_nome(row, ["DEMANDA_90", "DEMANDA_POA"]), tipo=int),
            "demanda_soma": tratar_valor(obter_valor_por_nome(row, ["DEMANDA_SOMA", "TOTAL_DEMANDA"]), tipo=int),
            
            # --- SUGESTÃO (INT) ---
            "sugestao_compra": tratar_valor(obter_valor_por_nome(row, ["SUGESTAO_COMPRA_30_DIAS", "SUGESTAO"]), tipo=int),
            
            # --- ESTOQUES (INT) ---
            "estoque_jv":   tratar_valor(obter_valor_por_nome(row, ["ESTOQUE_10", "ESTOQUE_JV"]), tipo=int),
            "estoque_sp":   tratar_valor(obter_valor_por_nome(row, ["ESTOQUE_70", "ESTOQUE_SP"]), tipo=int),
            "estoque_poa":  tratar_valor(obter_valor_por_nome(row, ["ESTOQUE_90", "ESTOQUE_POA"]), tipo=int),
            "estoque_soma": tratar_valor(obter_valor_por_nome(row, ["ESTOQUE_SOMA", "TOTAL_ESTOQUE"]), tipo=int),
            
            # --- PENDÊNCIAS (INT) ---
            "pendencia_jv":   tratar_valor(obter_valor_por_nome(row, ["PENDENTE_10", "PENDENCIA_JV"]), tipo=int),
            "pendencia_sp":   tratar_valor(obter_valor_por_nome(row, ["PENDENTE_70", "PENDENCIA_SP"]), tipo=int),
            "pendencia_poa":  tratar_valor(obter_valor_por_nome(row, ["PENDENTE_90", "PENDENCIA_POA"]), tipo=int),
            "pendencia_soma": tratar_valor(obter_valor_por_nome(row, ["PENDENTE_SOMA", "TOTAL_PENDENCIA"]), tipo=int),
            
            # --- FALTAS (INT) ---
            "falta_jv":   tratar_valor(obter_valor_por_nome(row, ["FALTA_10", "RUPTURA_JV"]), tipo=int),
            "falta_sp":   tratar_valor(obter_valor_por_nome(row, ["FALTA_70", "RUPTURA_SP"]), tipo=int),
            "falta_poa":  tratar_valor(obter_valor_por_nome(row, ["FALTA_90", "RUPTURA_POA"]), tipo=int),
            "falta_soma": tratar_valor(obter_valor_por_nome(row, ["FALTA_SOMA", "TOTAL_FALTA"]), tipo=int),
            "falta_soma_total": 0,

            # --- NÍVEIS (FLOAT) ---
            "atendimento": tratar_porcentagem(obter_valor_por_nome(row, ["ATENDIMENTO", "NIVEL_SERVICO"])),
            "frequencia":  tratar_porcentagem(obter_valor_por_nome(row, ["FREQUENCIA", "FREQ"])),
        }

        # Tenta Inserir
        supabase.table("tb_analise_compra").insert(dados).execute()
        
    except Exception as e:
        print(f"Erro Analise SKU {sku_id}: {e}")
        try:
            registrar_log_erro(sku_id, f"Erro Fatal Insert Analise: {str(e)}", None, str(dados))
        except: pass

def salvar_historico(row, sku_id):
    try:
        supabase.table("tb_historico_vendas").delete().eq("sku_id", sku_id).execute()

        idx_inicial = -1
        colunas = row.index.tolist()
        
        for i, nome_col in enumerate(colunas):
            s_col = str(nome_col).upper()
            if "QTD" in s_col and ("/" in s_col or "_" in s_col):
                if i+1 < len(colunas) and "VALOR" in str(colunas[i+1]).upper():
                    idx_inicial = i
                    break
        
        if idx_inicial == -1: idx_inicial = 4

        batch = []
        idx_atual = idx_inicial
        
        for seq in range(1, 26):
            if idx_atual + 1 >= len(row): break

            q = tratar_valor(row.iloc[idx_atual], tipo=int)
            v = tratar_valor(row.iloc[idx_atual+1], tipo=float)

            if q != 0 or v != 0:
                batch.append({
                    "sku_id": sku_id,
                    "periodo_sequencia": seq,
                    "quantidade": q,
                    "valor": v
                })
            
            idx_atual += 2

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
                sku_id = salvar_sku(row)
                
                if sku_id:
                    salvar_analise(row, sku_id)
                    salvar_historico(row, sku_id)
                    total_sucessos += 1
                else:
                    # CORREÇÃO 1: Registrar log quando o SKU falha (retorna None)
                    total_erros += 1
                    msg_erro = "SKU não identificado, inválido ou erro ao salvar produto (verifique logs do console)"
                    
                    # Tenta pegar qual seria o código para facilitar o log
                    cod_tentativa = str(obter_valor_por_nome(row, ['CODIGO', 'REFERENCIA', 'SKU']) or "DESCONHECIDO")
                    msg_erro += f" - Código tentado: {cod_tentativa}"

                    registrar_log_erro(
                        linha=index + 2,
                        motivo=msg_erro,
                        user_id=user_id,
                        row_data=row
                    )

            except Exception as e:
                # CORREÇÃO 2: Este bloco pega erros gerais do loop (ex: falha no salvar_analise que não foi tratada)
                print(f"Erro linha {index}: {e}")
                total_erros += 1
                registrar_log_erro(
                    linha=index + 2,
                    motivo=str(e),
                    user_id=user_id,
                    row_data=row
                )

        return {"status": "success", "processed": total_sucessos, "errors": total_erros}

    except Exception as e:
        print(f"CRÍTICO - Falha ao abrir CSV: {e}")
        registrar_log_global("UPLOAD_CSV", str(e), user_id)
        raise e