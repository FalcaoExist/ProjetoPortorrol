import os

import requests
from dotenv import load_dotenv

load_dotenv()

URL = os.getenv("SUPABASE_URL")
print(f"Tentando conectar em: {URL}")

try:
    # Tenta acessar a saúde da API do Supabase
    resp = requests.get(f"{URL}/rest/v1/", timeout=5)
    print(f"✅ Conexão HTTP: OK ({resp.status_code})")
except Exception as e:
    print(f"❌ Falha de Conexão: {e}")