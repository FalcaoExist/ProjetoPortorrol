import pandas as pd
import io
from app.repositories.import_repository import (
    salvar_sku,
    salvar_analise,
    salvar_historico,
    registrar_log_erro,
    registrar_log_global
)

def processar_background(file_contents: bytes, filename: str, user_id: str):
    """
    Esta função roda 'sozinha' após o servidor responder ao usuário.
    """
    print(f"--- [BG] Iniciando processamento: {filename} ---")
    
    try:
        # 1. Transformar Bytes em DataFrame (Pandas)
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(file_contents), sep=',', encoding='utf-8')
            except:
                df = pd.read_csv(io.BytesIO(file_contents), sep=';', encoding='latin-1')
        else:
            df = pd.read_excel(io.BytesIO(file_contents))

        # 2. Validações
        if df.empty or len(df.columns) < 2:
            registrar_log_global(filename, "Arquivo vazio ou colunas insuficientes", user_id)
            return

        # 3. Loop de Processamento (Sua lógica original)
        sucesso = 0
        erros = 0
        
        for index, row in df.iterrows():
            try:
                if row.isna().all(): continue

                # SKU
                sku_id = salvar_sku(row)
                if not sku_id: continue 

                # Análise e Histórico
                salvar_analise(row, sku_id)
                salvar_historico(row, sku_id)

                sucesso += 1

            except Exception as e:
                erros += 1
                # Registra o log passando o user_id corretamente
                registrar_log_erro(
                    linha=index + 2,
                    motivo=str(e),
                    user_id=user_id,
                    row_data=row
                )

        print(f"--- [BG] FIM. Sucesso: {sucesso} | Erros: {erros} ---")

    except Exception as e_critico:
        # Se o arquivo estiver corrompido ou o Pandas falhar
        registrar_log_global(filename, f"Erro Fatal: {str(e_critico)}", user_id)