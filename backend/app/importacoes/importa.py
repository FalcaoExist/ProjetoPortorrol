import io

import pandas as pd
import requests
from supabase import Client, create_client

SUPABASE_URL = "https://bsueftwnqspzwaiggvvq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzdWVmdHducXNwendhaWdndnZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTgwNzEwMSwiZXhwIjoyMDc3MzgzMTAxfQ.mfpyP9uhFI8L6F8OBEAuGU3YU0xbHrIa3Guh2HzHp6o"

BUCKET_NAME = "importacoes"
NOME_TABELA_LOGS = "audit_logs"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def testar_conexao():
    print(f"Verificando acesso ao sistema em: {SUPABASE_URL}")
    try:
        requests.get(f"{SUPABASE_URL}/rest/v1/", timeout=5)
        print("Conexão estabelecida com sucesso.")
        return True
    except Exception as e:
        print(f"Falha na conexão normal: {e}")
        print("Tentando conexão alternativa...")
        try:
            requests.get(f"{SUPABASE_URL}/rest/v1/", timeout=5, verify=False)
            print("Conexão estabelecida via método alternativo.")
            return True
        except Exception as e2:
            print(f"Não foi possível conectar ao sistema. Verifique a rede. Erro: {e2}")
            return False

def tratar_valor(valor, tipo=int):
    try:
        if pd.isna(valor) or str(valor).strip() == "": return 0
        if tipo == int: return int(float(valor))
        return float(valor)
    except: return 0

def tratar_porcentagem(valor):
    try:
        if pd.isna(valor) or str(valor).strip() == "": return 0.0
        s_valor = str(valor).replace('%', '').replace(',', '.').strip()
        return float(s_valor)
    except: return 0.0

def registrar_log_erro(linha, motivo, nome_arq, row_data):
    print(f"Registro inconsistente na linha {linha}: {motivo}")
    try:
        dados = str(row_data.to_dict()) if hasattr(row_data, 'to_dict') else str(row_data)
        msg = f"Arquivo: {nome_arq} | Linha: {linha} | Motivo: {motivo} | Conteudo: {dados}"
        if len(msg) > 4000: msg = msg[:4000] + "..."

        supabase.table(NOME_TABELA_LOGS).insert({
            "action": "FALHA_IMPORTACAO",
            "details": msg,
            "user_name": "ROBO_IMPORTACAO"
        }).execute()
    except Exception as e:
        print(f"Não foi possível salvar o registro de erro no banco: {e}")

def validar_obrigatorios(row, index, nome_arq):
    erros = []
    if len(row) > 0:
        if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == "": erros.append("Nome do Produto ausente")
    else: return False

    if len(row) > 1:
        if pd.isna(row.iloc[1]) or str(row.iloc[1]).strip() == "": erros.append("Código SKU ausente")
    else: return False
    
    if len(row) > 73:
        if pd.isna(row.iloc[73]) or str(row.iloc[73]).strip() == "": erros.append("Classificação ausente")
    else: erros.append("Estrutura do arquivo incorreta (faltam colunas)")

    if erros:
        registrar_log_erro(index + 2, ", ".join(erros), nome_arq, row)
        return False
    return True

def processar_arquivo_individual(nome_arquivo):
    print(f"Iniciando leitura do arquivo: {nome_arquivo}")
    
    try:
        response = supabase.storage.from_(BUCKET_NAME).download(nome_arquivo)
        arquivo = io.BytesIO(response)
        
        if nome_arquivo.endswith('.csv'):
            try:
                df = pd.read_csv(arquivo, sep=',', encoding='utf-8')
            except:
                arquivo.seek(0)
                df = pd.read_csv(arquivo, sep=';', encoding='utf-8')
        else:
            df = pd.read_excel(arquivo, engine='openpyxl')
            
        print(f"Arquivo aberto. Total de registros encontrados: {len(df)}")
        
    except Exception as e:
        print(f"Falha ao abrir o arquivo {nome_arquivo}. Erro técnico: {e}")
        return

    sucesso = 0
    ignorados = 0

    for index, row in df.iterrows():
        try:
            val_codigo = str(row.iloc[1]).strip().lower()
            if val_codigo in ["codigo", "código", "sku", "code", "referencia"]: continue 

            if not validar_obrigatorios(row, index, nome_arquivo):
                ignorados += 1
                continue

            dados_produto = {
                "nome_produto": str(row.iloc[0]),
                "codigo": str(row.iloc[1]),
                "marca": str(row.iloc[2]),
                "classificacao": str(row.iloc[73]) 
            }
            res_sku = supabase.table("tb_skus").upsert(dados_produto, on_conflict="codigo").execute()
            sku_id = res_sku.data[0]['id']

            dados_analise = {
                "sku_id": sku_id,
                "demanda_jv": tratar_valor(row.iloc[54]),
                "demanda_sp": tratar_valor(row.iloc[55]),
                "demanda_poa": tratar_valor(row.iloc[56]),
                "demanda_soma": tratar_valor(row.iloc[57]),
                "sugestao_compra": tratar_valor(row.iloc[58]),
                "estoque_jv": tratar_valor(row.iloc[59]),
                "estoque_sp": tratar_valor(row.iloc[60]),
                "estoque_poa": tratar_valor(row.iloc[61]),
                "estoque_soma": tratar_valor(row.iloc[62]),
                "pendencia_jv": tratar_valor(row.iloc[63]),
                "pendencia_sp": tratar_valor(row.iloc[64]),
                "pendencia_poa": tratar_valor(row.iloc[65]),
                "pendencia_soma": tratar_valor(row.iloc[66]),
                "falta_jv": tratar_valor(row.iloc[67]),
                "falta_sp": tratar_valor(row.iloc[68]),
                "falta_poa": tratar_valor(row.iloc[69]),
                "falta_soma": tratar_valor(row.iloc[70]),
                "falta_soma_total": 0, 
                "atendimento": tratar_porcentagem(row.iloc[71]),
                "frequencia": tratar_porcentagem(row.iloc[72]),
            }
            supabase.table("tb_analise_compra").delete().eq("sku_id", sku_id).execute()
            supabase.table("tb_analise_compra").insert(dados_analise).execute()

            supabase.table("tb_historico_vendas").delete().eq("sku_id", sku_id).execute()
            historico_batch = []
            idx_coluna = 4 
            for i in range(1, 26):
                qtd = tratar_valor(row.iloc[idx_coluna])
                vlr = tratar_valor(row.iloc[idx_coluna + 1], float)
                if qtd != 0 or vlr != 0:
                    historico_batch.append({
                        "sku_id": sku_id,
                        "periodo_sequencia": i,
                        "quantidade": qtd,
                        "valor": vlr
                    })
                idx_coluna += 2 

            if historico_batch:
                supabase.table("tb_historico_vendas").insert(historico_batch).execute()

            sucesso += 1
            if sucesso % 50 == 0: print(f"Processando... {sucesso} itens concluídos.")

        except Exception as e:
            registrar_log_erro(index + 2, f"Erro inesperado no sistema: {str(e)}", nome_arquivo, row)
            ignorados += 1
            
    print(f"Processamento de '{nome_arquivo}' finalizado. Importados: {sucesso}. Ignorados: {ignorados}.")

def iniciar_varredura():
    print("Iniciando busca por arquivos...")
    if not testar_conexao():
        print("Processo abortado devido a falha de rede.")
        return

    try:
        arquivos = supabase.storage.from_(BUCKET_NAME).list()
    except Exception as e:
        print(f"Não foi possível acessar a pasta de arquivos. Detalhe: {e}")
        return

    encontrados = 0
    for item in arquivos:
        nome = item['name']
        if nome.startswith('.') or nome.startswith('processados'): continue
        
        if nome.endswith('.csv') or nome.endswith('.xlsx'):
            processar_arquivo_individual(nome)
            encontrados += 1
            
    if encontrados == 0:
        print("Nenhum arquivo válido encontrado para importação.")

if __name__ == "__main__":
    iniciar_varredura()