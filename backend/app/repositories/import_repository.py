import pandas as pd
import io
from app.core.supabase_client import supabase

def tratar_valor(valor, tipo=float, default=0):
  
    if pd.isna(valor) or str(valor).strip() == "":
        return default
    
    try:
        s = str(valor).strip()
        # Limpeza pesada de caracteres indesejados
        s = s.replace('R$', '').replace(' ', '').replace('"', '').replace("'", "")

        if not s: return default

        # Lógica de Pontuação
        # Se tem mais de uma vírgula (ex: 1,200,500), remove todas (milhar)
        if s.count(',') > 1:
            s = s.replace(',', '')
        else:
            # Padrão BR: 1.000,00 -> Tira ponto, troca vírgula por ponto
            s = s.replace('.', '').replace(',', '.')

        val_float = float(s)
        
        if tipo == int:
            return int(val_float)
        return val_float

    except Exception:
        return default

def tratar_porcentagem(valor):
    """
    Trata '100,00%', '100%', etc.
    """
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
    """
    Busca o valor da célula procurando pelo NOME da coluna.
    Aceita uma lista de tentativas (ex: ['DEMANDA_10', 'DEMANDA 10', 'Demanda_JV'])
    """
    if isinstance(lista_nomes_possiveis, str):
        lista_nomes_possiveis = [lista_nomes_possiveis]

    # Cria mapa de colunas normalizado (upper e sem espaços) para busca
    mapa_colunas = {str(c).strip().upper(): c for c in row.index}

    for nome_alvo in lista_nomes_possiveis:
        chave = str(nome_alvo).strip().upper()
        if chave in mapa_colunas:
            coluna_real = mapa_colunas[chave]
            return row[coluna_real]
            
    return 0 # Não achou a coluna


def salvar_sku(row):
    """
    Salva SKU (Pai). Retorna ID ou None.
    Busca colunas chaves pelo nome ou índice fixo como fallback.
    """
    # Tenta achar códigos pelo nome ou usa índice padrão
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
        # UPSERT
        res = supabase.table("tb_skus").upsert(dados_produto, on_conflict="codigo").execute()
        if res.data: return res.data[0]['id']
        
        # Fallback busca ID
        busca = supabase.table("tb_skus").select("id").eq("codigo", codigo).execute()
        if busca.data: return busca.data[0]['id']
        
    except Exception as e:
        print(f"Erro SKU {codigo}: {e}")
    
    return None

def salvar_analise(row, sku_id):
    """
    Salva Análise buscando colunas pelo NOME para evitar zeros.
    """
    try:
        supabase.table("tb_analise_compra").delete().eq("sku_id", sku_id).execute()

        # Mapeamento dinâmico (Adicione variações de nome se precisar)
        dados = {
            "sku_id": sku_id,
            "demanda_jv":   tratar_valor(obter_valor_por_nome(row, ["DEMANDA_10", "DEMANDA_JV"])),
            "demanda_sp":   tratar_valor(obter_valor_por_nome(row, ["DEMANDA_70", "DEMANDA_SP"])),
            "demanda_poa":  tratar_valor(obter_valor_por_nome(row, ["DEMANDA_90", "DEMANDA_POA"])),
            "demanda_soma": tratar_valor(obter_valor_por_nome(row, ["DEMANDA_SOMA", "TOTAL_DEMANDA"])),
            
            "sugestao_compra": tratar_valor(obter_valor_por_nome(row, ["SUGESTAO_COMPRA_30_DIAS", "SUGESTAO"])),
            
            "estoque_jv":   tratar_valor(obter_valor_por_nome(row, ["ESTOQUE_10", "ESTOQUE_JV"])),
            "estoque_sp":   tratar_valor(obter_valor_por_nome(row, ["ESTOQUE_70", "ESTOQUE_SP"])),
            "estoque_poa":  tratar_valor(obter_valor_por_nome(row, ["ESTOQUE_90", "ESTOQUE_POA"])),
            "estoque_soma": tratar_valor(obter_valor_por_nome(row, ["ESTOQUE_SOMA", "TOTAL_ESTOQUE"])),
            
            "pendencia_jv":   tratar_valor(obter_valor_por_nome(row, ["PENDENTE_10", "PENDENCIA_JV"])),
            "pendencia_sp":   tratar_valor(obter_valor_por_nome(row, ["PENDENTE_70", "PENDENCIA_SP"])),
            "pendencia_poa":  tratar_valor(obter_valor_por_nome(row, ["PENDENTE_90", "PENDENCIA_POA"])),
            "pendencia_soma": tratar_valor(obter_valor_por_nome(row, ["PENDENTE_SOMA", "TOTAL_PENDENCIA"])),
            
            "falta_jv":   tratar_valor(obter_valor_por_nome(row, ["FALTA_10", "RUPTURA_JV"])),
            "falta_sp":   tratar_valor(obter_valor_por_nome(row, ["FALTA_70", "RUPTURA_SP"])),
            "falta_poa":  tratar_valor(obter_valor_por_nome(row, ["FALTA_90", "RUPTURA_POA"])),
            "falta_soma": tratar_valor(obter_valor_por_nome(row, ["FALTA_SOMA", "TOTAL_FALTA"])),
            "falta_soma_total": 0,

            "atendimento": tratar_porcentagem(obter_valor_por_nome(row, ["ATENDIMENTO", "NIVEL_SERVICO"])),
            "frequencia":  tratar_porcentagem(obter_valor_por_nome(row, ["FREQUENCIA", "FREQ"])),
        }

        supabase.table("tb_analise_compra").insert(dados).execute()
        
    except Exception as e:
        print(f"Erro Analise SKU {sku_id}: {e}")

def salvar_historico(row, sku_id):
    """
    Busca AUTOMATICAMENTE onde começam as colunas de 'QTD_'.
    """
    try:
        supabase.table("tb_historico_vendas").delete().eq("sku_id", sku_id).execute()

        # 1. Acha o índice da primeira coluna de Quantidade (Ex: 'QTD_10/2023')
        idx_inicial = -1
        colunas = row.index.tolist()
        
        for i, nome_col in enumerate(colunas):
            s_col = str(nome_col).upper()
            # Critério: Começa com QTD e tem barra de data (ex: /2023) ou é QTD_10
            if "QTD" in s_col and ("/" in s_col or "_" in s_col):
                # Validar se a próxima é valor
                if i+1 < len(colunas) and "VALOR" in str(colunas[i+1]).upper():
                    idx_inicial = i
                    break
        
        if idx_inicial == -1:
            idx_inicial = 4 # Fallback se não achar nada

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

# ==============================================================================
# 3. O MAESTRO (PROCESSAMENTO PRINCIPAL)
# ==============================================================================

def process_import_file(file_content, user_id=None):
    """
    Recebe o CONTEÚDO do arquivo (bytes) ou SpooledTemporaryFile.
    Lê com Pandas detectando separador automaticamente.
    """
    print(">>> Iniciando leitura do CSV...")
    
    try:
        # Tenta detectar separador automaticamente (sep=None, engine='python')
        # Isso resolve o erro 400 Bad Request se o arquivo for separado por ;
        df = pd.read_csv(io.BytesIO(file_content), sep=None, engine='python', dtype=str)
        
        # Remove linhas totalmente vazias
        df.dropna(how='all', inplace=True)
        
        print(f">>> CSV Lido. Colunas encontradas: {len(df.columns)}")
        print(f">>> Primeiras colunas: {df.columns[:5].tolist()}")
        
        total_sucessos = 0
        total_erros = 0

        for index, row in df.iterrows():
            try:
                # 1. Salva SKU
                sku_id = salvar_sku(row)
                
                if sku_id:
                    # 2. Salva Filhos
                    salvar_analise(row, sku_id)
                    salvar_historico(row, sku_id)
                    total_sucessos += 1
                else:
                    total_erros += 1

            except Exception as e:
                print(f"Erro linha {index}: {e}")
                total_erros += 1

        return {"status": "success", "processed": total_sucessos, "errors": total_erros}

    except Exception as e:
        print(f"CRÍTICO - Falha ao abrir CSV: {e}")
        # Retorna o erro para quem chamou (Controller) lidar com o 400
        raise e