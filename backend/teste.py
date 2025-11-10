import os
from dotenv import load_dotenv

# 1. Certifique-se de que o load_dotenv() está sendo chamado
load_dotenv() 

# 2. Adicione estes prints
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY") # Verifique este nome

print("--- DEBUG SUPABASE ---")
print("URL Carregada:", url)
print("Chave Carregada:", key)
print("------------------------")

# 3. O 'key' aqui NÃO PODE ser None
supabase: Client = create_client(url, key)