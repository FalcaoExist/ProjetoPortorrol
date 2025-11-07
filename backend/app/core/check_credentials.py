import os

import bcrypt
from supabase import Client, create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def check_credentials(email: str, password: str):
    """Verifica credenciais no Supabase usando hash"""
    response = supabase.table("users").select("*").eq("user_email", email).execute()
    data = response.data
    if data and bcrypt.checkpw(password.encode(), data[0]["user_password"].encode()):
        return {"user_id": data[0]["user_id"], "user_email": data[0]["user_email"]}
    return None
