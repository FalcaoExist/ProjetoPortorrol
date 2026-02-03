import os
import io
import time
import pandas as pd
import sys
from app.core.supabase_client import supabase

def log_worker(message):
    print(f"🤖 [IBy-Worker]: {message}")
    sys.stdout.flush()

BUCKET_NAME = "automacao"
UPLOAD_FOLDER = "uploads"

def clean_to_int(value):
    """Converte valores da planilha para inteiros, removendo pontos e vírgulas."""
    if pd.isna(value) or str(value).lower() == 'nan' or str(value).strip() == '':
        return 0
    try:
        # Limpa o formato (ex: '1.234,56' vira 1234)
        cleaned = str(value).replace('.', '').replace(',', '.')
        return int(float(cleaned))
    except:
        return 0

def process_and_clean():
    try:
        response = supabase.storage.from_(BUCKET_NAME).list(UPLOAD_FOLDER)
        valid_files = [f for f in response if f['name'].endswith('.csv') and f['name'] not in [".keep", ".emptyFolderPlaceholder"]]

        if not valid_files:
            return

        for f in valid_files:
            file_name = f['name']
            file_path = f"{UPLOAD_FOLDER}/{file_name}"
            log_worker(f"📂 Criando novos SKUs do arquivo: {file_name}")
            
            try:
                data = supabase.storage.from_(BUCKET_NAME).download(file_path)
                
                # IMPORTANTE: header=None pois seu CSV começa direto nos dados
                df = pd.read_csv(io.BytesIO(data), sep=None, engine='python', dtype=str, header=None)
                df.dropna(how='all', inplace=True)

                for _, row in df.iterrows():
                    # 1. MAPEAMENTO DE DADOS
                    name = str(row.iloc[0]).strip() if len(row) > 0 else None
                    if not name or name.lower() == 'nan': continue

                    code = str(row.iloc[1]).strip() if len(row) > 1 else name
                    brand = str(row.iloc[2]).strip() if len(row) > 2 else ""
                    stock = clean_to_int(row.iloc[4]) # Coluna 5 da planilha
                    demand = clean_to_int(row.iloc[6]) # Coluna 7 da planilha
                    
                    # Pega a classificação na última coluna (74)
                    classification = str(row.iloc[-1]).strip().upper() 

                    # 2. CRIAÇÃO OU ATUALIZAÇÃO DO SKU
                    sku_check = supabase.table("tb_skus").select("id").eq("nome_produto", name).execute()
                    
                    sku_payload = {
                        "nome_produto": name, 
                        "codigo": code, 
                        "marca": brand, 
                        "classificacao": classification
                    }
                    
                    if sku_check.data:
                        sku_id = sku_check.data[0]['id']
                        supabase.table("tb_skus").update(sku_payload).eq("id", sku_id).execute()
                    else:
                        # Cria o SKU novo com a classificação certa (não vai ser 'Geral')
                        res = supabase.table("tb_skus").insert(sku_payload).execute()
                        sku_id = res.data[0]['id']
                        log_worker(f"✨ SKU Criado: {name} [{classification}]")

                    # 3. ALIMENTA A ANÁLISE (O que o seu DashboardService lê)
                    analysis_payload = {
                        "sku_id": sku_id,
                        "estoque_soma": stock,
                        "demanda_soma": demand
                    }
                    
                    # Força o dado a entrar na tb_analise_compra
                    analysis_check = supabase.table("tb_analise_compra").select("id").eq("sku_id", sku_id).execute()
                    if analysis_check.data:
                        supabase.table("tb_analise_compra").update(analysis_payload).eq("sku_id", sku_id).execute()
                    else:
                        supabase.table("tb_analise_compra").insert(analysis_payload).execute()

                # 4. FINALIZAÇÃO
                supabase.storage.from_(BUCKET_NAME).remove([file_path])
                log_worker(f"✅ Sucesso: {file_name} processado. Verifique o dashboard agora.")
                
            except Exception as e:
                log_worker(f"❌ Erro no conteúdo: {e}")

    except Exception as e:
        log_worker(f"⚠️ Erro de conexão: {e}")

if __name__ == "__main__":
    log_worker("🚀 Monitor IBy Rodando (Modo Importação Direta)")
    while True:
        process_and_clean()
        time.sleep(10)