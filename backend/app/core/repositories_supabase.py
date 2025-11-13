# PEGA OS DADOS DO SUPABASE

from fastapi import HTTPException

from app.core.supabase_client import supabase

from .interfaces import IUserRepository


class SupabaseUserRepository(IUserRepository):
    """Repositório de usuários baseado em tabela do Supabase."""

    def get_user_by_email(self, email: str):
        try:
            response = supabase.table("users").select("*").eq("email", email).execute()

            if not response.data:
                return None

            # Supabase retorna uma lista de registros; pegamos o primeiro
            user = response.data[0]

            return {
                "id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "password": user["password_hash"],  # ou o nome da coluna real da senha
                "role": user["role"],
                "status": user["is_active"]
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao acessar Supabase: {e}")
