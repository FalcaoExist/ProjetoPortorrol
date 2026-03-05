import os
from dotenv import load_dotenv
from supabase import Client, create_client
from supabase.lib.client_options import ClientOptions  # <--- Importação necessária

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env")

# --- CORREÇÃO DO TIMEOUT ---
# Definimos explicitamente para esperar até 60 segundos pela resposta do banco
options = ClientOptions(
    postgrest_client_timeout=60, 
    storage_client_timeout=60
)

supabase: Client = create_client(
    SUPABASE_URL, 
    SUPABASE_SERVICE_ROLE_KEY, 
    options=options # <--- Passamos as opções aqui
)
