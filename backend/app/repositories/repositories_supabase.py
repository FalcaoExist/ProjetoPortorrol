import logging
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from app.core.interfaces import IUserRepository
from app.core.supabase_client import supabase

logger = logging.getLogger(__name__)

class SupabaseUserRepository(IUserRepository):
    """Repositório de usuários baseado em tabela do Supabase."""

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        try:
            response = supabase.table("users").select("*").eq("email", email).execute()
            if not response.data:
                return None
            return response.data[0]
        except Exception as e:
            logger.exception("Erro ao buscar usuário por email: %s", email)
            return None

    def get_suppliers_for_user(self, user_id: str) -> List[str]:
        try:
            response_ids = supabase.table("user_suppliers").select("supplier_id").eq("user_id", user_id).execute()
            
            if not response_ids.data:
                return []
      
            supplier_ids = [item["supplier_id"] for item in response_ids.data]
            
            if not supplier_ids:
                return []

            try:
                response_names = supabase.table("suppliers").select("name").in_("id", supplier_ids).execute()
            except Exception:
                response_names = supabase.table("suppliers").select("name").in_("supplier_id", supplier_ids).execute()
            
            return [item["name"] for item in response_names.data]

        except Exception as e:
            logger.exception("Erro ao buscar fornecedores do usuário - user_id: %s", user_id)
            return []

    def get_all_users(self) -> List[Dict[str, Any]]:
        """
        ESTRATÉGIA ULTRA RÁPIDA: 3 Consultas Fixas.
        Carrega tudo de uma vez e monta na memória.
        """
        try:
            users_response = supabase.table("users").select("*").execute()
            if not users_response.data:
                return []

            rels_response = supabase.table("user_suppliers").select("*").execute()

            suppliers_response = supabase.table("suppliers").select("*").execute()

            supplier_map = {}
            if suppliers_response.data:
                for s in suppliers_response.data:
                    s_id = s.get("id") or s.get("supplier_id")
                    if s_id:
                        supplier_map[s_id] = s["name"]

            user_suppliers_map = {}
            if rels_response.data:
                for item in rels_response.data:
                    u_id = item["user_id"]
                    s_id = item["supplier_id"]
                    
                    if s_id in supplier_map:
                        if u_id not in user_suppliers_map:
                            user_suppliers_map[u_id] = []
                        user_suppliers_map[u_id].append(supplier_map[s_id])

            final_users_list = []
            for u in users_response.data:
                u_id = u["user_id"]
                current_suppliers = user_suppliers_map.get(u_id, [])

                final_users_list.append({
                    "user_id": u_id,
                    "name": u["name"],
                    "email": u["email"],
                    "role": u.get("role", "comprador"),
                    "is_active": u.get("is_active", True),
                    "supplier": current_suppliers 
                })
                
            return final_users_list

        except Exception as e:
            logger.exception("Erro ao buscar todos os usuários")
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
            logger.exception("Erro ao criar usuário - email: %s", user_data.get("email"))
            raise

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = supabase.table("users").select("*").eq("user_id", user_id).execute()
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            logger.exception("Erro ao buscar usuário por ID - user_id: %s", user_id)
            return None

    def update_user(self, user_id: str, updates: dict) -> Dict[str, Any]:
        try:
            response = supabase.table("users").update(updates).eq("user_id", user_id).execute()
            if response.data:
                return response.data[0]
            raise Exception("Usuário não encontrado para atualização.")
        except Exception as e:
            logger.exception("Erro ao atualizar usuário - user_id: %s", user_id)
            raise

    def sync_user_suppliers(self, user_id: str, supplier_names: List[str]) -> None:
        try:
            supabase.table("user_suppliers").delete().eq("user_id", user_id).execute()
            
            if not supplier_names or len(supplier_names) == 0:
                return

            suppliers_response = supabase.table("suppliers").select("*").in_("name", supplier_names).execute()
            
            if not suppliers_response.data:
                return

            records_to_insert = []
            for item in suppliers_response.data:
                found_id = item.get("id") or item.get("supplier_id")
                if found_id:
                    records_to_insert.append({
                        "user_id": user_id,
                        "supplier_id": found_id
                    })

            if records_to_insert:
                supabase.table("user_suppliers").insert(records_to_insert).execute()

        except Exception as e:
            logger.exception("Erro ao sincronizar fornecedores do usuário - user_id: %s", user_id)
            raise

    def get_all_suppliers(self) -> List[str]:
        try:
            response = supabase.table("suppliers").select("name").execute()
            if not response.data:
                return []
            return [item["name"] for item in response.data]
        except Exception as e:
            logger.exception("Erro ao buscar lista de fornecedores")
            return []
        
    def delete_user(self, user_id: str) -> None:
            try:
                supabase.table("user_suppliers").delete().eq("user_id", user_id).execute()
                response = supabase.table("users").delete().eq("user_id", user_id).execute()
                    
                if not response.data:
                    logger.warning("Usuário %s não encontrado ou já deletado", user_id)

            except Exception as e:
                    logger.exception("Erro ao deletar usuário - user_id: %s", user_id)
                    raise

    def insert_audit_log(self, performed_by: str, action: str, entity: str, entity_id: Optional[str], extra: Optional[dict] = None) -> None:
        try:
            actor = str(performed_by).strip() if performed_by is not None else ""
            payload = {
                "user_id": actor or "system",
                "action": action,
                "entity": entity,
                "entity_id": str(entity_id) if entity_id else None,
                "extra": extra or {}
            }
            supabase.table("audit_logs").insert(payload).execute()
        except Exception as e:
            logger.error("Erro ao inserir log de auditoria - entity: %s - erro: %s", entity, str(e))

    def insert_login_attempt(self, email_attempted: str, success: bool, user_id: Optional[str], ip_address: Optional[str] = None) -> None:
        try:
            payload = {
                "email_attempted": email_attempted,
                "success": success,
                "user_id": str(user_id) if user_id else None,
                "ip_address": ip_address
            }
            supabase.table("login_attempts").insert(payload).execute()
        except Exception as e:
            logger.error(
                "Erro ao registrar tentativa de login - email: %s - erro: %s",
                email_attempted,
                str(e),
            )

    def get_audit_logs(self, filters: dict) -> List[Dict[str, Any]]:
        """
        Busca logs e substitui IDs de usuário pelos seus nomes (JOIN manual).
        """
        try:
            query = supabase.table("audit_logs").select("*")
            
            if filters.get("user_id"): 
                query = query.eq("user_id", filters["user_id"])
            
            if filters.get("action"): 
                query = query.eq("action", filters["action"])
            
            if filters.get("entity"): 
                query = query.eq("entity", filters["entity"])
            
            if filters.get("from"): 
                query = query.gte("created_at", f"{filters['from']}T00:00:00")
            
            if filters.get("to"): 
                query = query.lte("created_at", f"{filters['to']}T23:59:59")
            
            query = query.order("created_at", desc=True)
            
            limit = int(filters.get("limit", 100))
            offset = int(filters.get("offset", 0))
            
            logs_response = query.range(offset, offset + limit - 1).execute()
            logs = logs_response.data or []
            
            if not logs:
                return []

            user_ids = set()
            for log in logs:
                uid = log.get("user_id")
                if uid and len(str(uid)) == 36 and uid != "system":
                    user_ids.add(uid)
            
            user_map = {}
            if user_ids:
                try:
                    users_resp = supabase.table("users").select("user_id, name").in_("user_id", list(user_ids)).execute()
                    if users_resp.data:
                        for u in users_resp.data:
                            user_map[u["user_id"]] = u["name"]
                except Exception as e:
                    logger.warning("Falha ao resolver nomes de usuários nos logs: %s", str(e))

            for log in logs:
                uid = log.get("user_id")
                
                if uid in user_map:
                    log["user_name"] = user_map[uid]
                elif uid == "system":
                    log["user_name"] = "Sistema"
                else:
                    if log.get("extra") and isinstance(log["extra"], dict) and log["extra"].get("name"):
                         log["user_name"] = f"{log['extra']['name']} (Excluído)"
                    else:
                        log["user_name"] = uid

            return logs

        except Exception:
            logger.exception("Erro ao buscar logs de auditoria")
            return []
    
    def get_login_attempts(self, limit: int = 200, offset: int = 0) -> List[Dict[str, Any]]:
        try:
            query = (
                supabase.table("login_attempts")
                .select("*")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
            )
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.exception("Erro ao buscar tentativas de login")
            return []