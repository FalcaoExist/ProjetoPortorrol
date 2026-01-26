import io

import pandas as pd

from app.repositories.import_repository import (
    log_error,
    log_global,
    save_analysis,
    save_history,
    save_sku,
)


def process_background(file_contents: bytes, filename: str, user_id: str):
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
            log_global(filename, "Arquivo vazio ou colunas insuficientes", user_id)
            return

        # 3. Loop de Processamento (Sua lógica original)
        success = 0
        errors = 0
        
        for index, row in df.iterrows():
            try:
                if row.isna().all():
                    continue
                sku_id = save_sku(row)
                if not sku_id:
                    continue
                save_analysis(row, sku_id)
                save_history(row, sku_id)
                success += 1

            except Exception as e:
                errors += 1
                log_error(
                    line=index + 2,
                    reason=str(e),
                    user_id=user_id,
                    row_data=row
                )

        print(f"--- [BG] FIM. Sucesso: {success} | Erros: {errors} ---")

    except Exception as e_critic:
        # Se o arquivo estiver corrompido ou o Pandas falhar
        log_global(filename, f"Erro Fatal: {str(e_critic)}", user_id)