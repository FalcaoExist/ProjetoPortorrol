import datetime
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from app.core.interfaces import IUserRepository
from app.core.supabase_client import supabase


class SupabaseUserRepository(IUserRepository):
    """Repositório de usuários baseado em tabela do Supabase."""

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        try:
            response = supabase.table("users").select("*").eq("email", email).execute()
            if not response.data:
                return None
            user = response.data[0]
            return {
                "id": user["user_id"],
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "password_hash": user.get("password_hash"),
                "role": user.get("role"),
                "is_active": user.get("is_active", False)
            }
        except Exception as e:
            print(f"[ERRO SUPABASE] {e}")
            raise HTTPException(status_code=500, detail="Ocorreu um erro inesperado. Tente novamente.")

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            resp = supabase.table("users").select("*").eq("user_id", user_id).execute()
            if not resp.data:
                return None
            user = resp.data[0]
            return {
                "id": user["user_id"],
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "password_hash": user.get("password_hash"),
                "role": user.get("role"),
                "is_active": user.get("is_active", False)
            }
        except Exception as e:
            print(f"[ERRO SUPABASE - get_user_by_id] {e}")
            raise HTTPException(status_code=500, detail="Erro ao buscar usuário.")

    def get_all_users(self) -> List[Dict[str, Any]]:
        try:
            resp = supabase.table("users").select("*").execute()
            return resp.data or []
        except Exception as e:
            print(f"[ERRO SUPABASE - get_all_users] {e}")
            raise HTTPException(status_code=500, detail="Erro ao buscar usuários.")

    def get_suppliers_for_user(self, user_id: str) -> List[str]:
        """
        Retorna lista de supplier ids vinculados ao usuário (tabela user_suppliers).
        Ajuste nomes de colunas/tabela conforme seu schema.
        """
        try:
            resp = (
                supabase.table("user_suppliers")
                .select("supplier_id")
                .eq("user_id", user_id)
                .execute()
            )
            if not resp.data:
                return []
            return [r["supplier_id"] for r in resp.data]
        except Exception as e:
            print(f"[ERRO SUPABASE - get_suppliers_for_user] {e}")
            raise HTTPException(status_code=500, detail="Erro ao buscar suppliers do usuário.")

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            resp = supabase.table("users").insert(user_data).execute()
            if not resp.data:
                raise HTTPException(status_code=500, detail="Falha ao criar usuário.")
            return resp.data[0]
        except Exception as e:
            print(f"[ERRO SUPABASE - create_user] {e}")
            raise HTTPException(status_code=500, detail="Erro ao criar usuário.")

    def sync_user_suppliers(self, user_id: str, supplier_ids: List[str]) -> None:
        """
        Sincroniza os suppliers do usuário:
         - remove atuais e insere novos na tabela de junção.
        """
        try:
            # delete current links
            supabase.table("user_suppliers").delete().eq("user_id", user_id).execute()

            if not supplier_ids:
                return

            # insert new links
            payload = [{"user_id": user_id, "supplier_id": s} for s in supplier_ids]
            supabase.table("user_suppliers").insert(payload).execute()

        except Exception as e:
            print(f"[ERRO SUPABASE - sync_user_suppliers] {e}")
            raise HTTPException(status_code=500, detail="Erro ao sincronizar suppliers.")

    def update_user(self, user_id: str, updates: Dict[str, Any]) -> bool:
        try:
            resp = supabase.table("users").update(updates).eq("user_id", user_id).execute()
            return bool(resp.data)
        except Exception as e:
            print(f"[ERRO SUPABASE - update_user] {e}")
            raise HTTPException(status_code=500, detail="Erro ao atualizar usuário.")

    def insert_audit_log(self, performed_by: str, action: str, entity: str, entity_id: str, extra: dict = None):
        try:
            payload = {
                "performed_by": performed_by,
                "action": action,
                "entity": entity,
                "entity_id": entity_id,
                "created_at": datetime.datetime.utcnow().isoformat(),
                "extra": extra or {}
            }
            supabase.table("audit_logs").insert(payload).execute()
        except Exception as e:
            # não interromper o fluxo por falha de logging
            print(f"[ERRO SUPABASE - insert_audit_log] {e}")
