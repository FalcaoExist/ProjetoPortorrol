# app/repositories/repositories_supabase.py
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

# Importa o cliente supabase já configurado
from app.core.supabase_client import supabase

from .interfaces import IUserRepository


class SupabaseUserRepository(IUserRepository):
    """Repositório de usuários baseado em tabela do Supabase."""

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        try:
            response = supabase.table("users").select("*").eq("email", email).execute()
            if not response.data:
                return None
            return response.data[0]
        except Exception as e:
            print(f"[ERRO SUPABASE - get_user_by_email] {e}")
            return None

    def get_all_users(self) -> List[Dict[str, Any]]:
        try:
            # Busca todos os usuários da tabela 'users'
            response = supabase.table("users").select("*").execute()
            
            if not response.data:
                return []

            users = []
            for u in response.data:
                # Normaliza os dados para o formato que o Service espera
                users.append({
                    "user_id": u["user_id"],
                    "name": u["name"],
                    "email": u["email"],
                    # Garante valores padrão caso venham nulos do banco
                    "role": u.get("role", "comprador"),
                    "is_active": u.get("is_active", True),
                    # Supplier será preenchido depois, mas precisa existir a chave
                    "supplier": [] 
                })
            return users

        except Exception as e:
            print(f"[ERRO SUPABASE - get_all_users] {e}")
            raise HTTPException(
                status_code=500,
                detail="Erro ao buscar usuários no banco de dados."
            )

    def create_user(self, user_data: dict) -> Dict[str, Any]:
        try:
            response = supabase.table("users").insert(user_data).execute()
            if response.data:
                return response.data[0]
            raise Exception("Erro ao inserir: Nenhum dado retornado.")
        except Exception as e:
            print(f"[ERRO SUPABASE - create_user] {e}")
            raise e

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = supabase.table("users").select("*").eq("user_id", user_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"[ERRO SUPABASE - get_user_by_id] {e}")
            return None

    def update_user(self, user_id: str, updates: dict) -> Dict[str, Any]:
        try:
            response = supabase.table("users").update(updates).eq("user_id", user_id).execute()
            if response.data:
                return response.data[0]
            raise Exception("Usuário não encontrado para atualização.")
        except Exception as e:
            print(f"[ERRO SUPABASE - update_user] {e}")
            raise e

    def sync_user_suppliers(self, user_id: str, supplier_names: List[str]) -> None:
        try:
            supabase.table("user_suppliers").delete().eq("user_id", user_id).execute()
            if not supplier_names:
                return
            records = [{"user_id": user_id, "supplier_name": name} for name in supplier_names]
            supabase.table("user_suppliers").insert(records).execute()
        except Exception as e:
            print(f"[ERRO SUPABASE - sync_suppliers] {e}")

    def get_suppliers_for_user(self, user_id: str) -> List[str]:
        try:
            response = supabase.table("user_suppliers").select("supplier_name").eq("user_id", user_id).execute()
            return [item["supplier_name"] for item in response.data]
        except Exception as e:
            print(f"[ERRO SUPABASE - get_suppliers] {e}")
            return []