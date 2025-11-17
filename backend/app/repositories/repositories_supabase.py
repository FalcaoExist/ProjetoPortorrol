from fastapi import HTTPException
from app.core.supabase_client import supabase
from app.core.interfaces import IUserRepository
from typing import List, Dict, Any, Optional
import uuid

class SupabaseUserRepository(IUserRepository):

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        try:
            response = supabase.table("users").select("*").eq("email", email).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"[ERRO SUPABASE get_user_by_email] {e}")
            raise HTTPException(status_code=500, detail="Erro ao buscar usuário.")

    def get_all_users(self) -> List[Dict[str, Any]]:
        try:
            response = supabase.table("users").select("*").execute()
            return response.data if response.data else []
        except Exception as e:
            print(f"[ERRO SUPABASE get_all_users] {e}")
            raise HTTPException(status_code=500, detail="Erro ao buscar usuários.")

    def create_user(self, user_data: dict) -> Dict[str, Any]:
        try:
            response = supabase.table("users").insert(user_data).execute()
            if not response.data:
                raise Exception("Nenhum dado retornado após inserção")
            return response.data[0]
        except Exception as e:
            print(f"[ERRO SUPABASE create_user] {e}")
            raise HTTPException(status_code=500, detail=f"Erro ao salvar usuário: {e}")

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = supabase.table("users").select("*").eq("user_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"[ERRO SUPABASE get_user_by_id] {e}")
            raise HTTPException(status_code=500, detail="Erro ao buscar usuário por ID.")

    def update_user(self, user_id: str, updates: dict) -> Dict[str, Any]:
        try:
            updates["updated_at"] = "now()"
            response = (
                supabase.table("users")
                .update(updates)
                .eq("user_id", user_id)
                .execute()
            )
            if not response.data:
                 raise Exception("Usuário não encontrado")
            return response.data[0]
        except Exception as e:
            print(f"[ERSO SUPABASE update_user] {e}")
            raise HTTPException(status_code=500, detail=f"Erro ao atualizar usuário: {e}")

    def get_suppliers_for_user(self, user_id: str) -> List[str]:
        try:
            response = (
                supabase.table("user_suppliers")
                .select("supplier_id")
                .eq("user_id", user_id)
                .execute()
            )
           
            return [item["supplier_id"] for item in response.data]
        except Exception as e:
            print(f"[ERRO SUPABASE get_suppliers_for_user] {e}")
            raise HTTPException(status_code=500, detail="Erro ao buscar fornecedores do usuário.")
   

    def sync_user_suppliers(self, user_id: str, supplier_ids: List[str]) -> None:
        try:
            supabase.table("user_suppliers").delete().eq("user_id", user_id).execute()

            if supplier_ids:
                rows_to_insert = [
                    {
                        "relation_id": str(uuid.uuid4()), 
                        "user_id": user_id, 
                        "supplier_id": s_id.strip() 
                    }
                    for s_id in supplier_ids
                ]
                
                supabase.table("user_suppliers").insert(rows_to_insert).execute()
        
        except Exception as e:
            print(f"[ERRO SUPABASE sync_user_suppliers] {e}")
            raise HTTPException(
                status_code=500, detail=f"Erro ao sincronizar fornecedores: {e}"
            )