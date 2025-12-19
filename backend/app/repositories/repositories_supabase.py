# app/repositories/repositories_supabase.py
from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from app.core.interfaces import IUserRepository

# Importa o cliente supabase já configurado
from app.core.supabase_client import supabase


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

    def get_suppliers_for_user(self, user_id: str) -> List[str]:
        """
        Busca fornecedores de UM usuário (usado no Editar).
        Busca IDs na junção -> Busca Nomes nos fornecedores.
        """
        try:
            # 1. Pega os IDs na tabela de junção
            response_ids = supabase.table("user_suppliers").select("supplier_id").eq("user_id", user_id).execute()
            
            if not response_ids.data:
                return []
            
            # Extrai lista de IDs
            supplier_ids = [item["supplier_id"] for item in response_ids.data]
            
            if not supplier_ids:
                return []

            # 2. Busca os nomes na tabela 'suppliers'
            # Tenta filtrar por 'id' ou 'supplier_id' para garantir compatibilidade
            try:
                response_names = supabase.table("suppliers").select("name").in_("id", supplier_ids).execute()
            except Exception: # [CORREÇÃO] Adicionado 'Exception' para satisfazer o linter
                response_names = supabase.table("suppliers").select("name").in_("supplier_id", supplier_ids).execute()
            
            return [item["name"] for item in response_names.data]

        except Exception as e:
            print(f"[ERRO SUPABASE - get_suppliers_for_user] {e}")
            return []

    def get_all_users(self) -> List[Dict[str, Any]]:
        """
        ESTRATÉGIA ULTRA RÁPIDA: 3 Consultas Fixas.
        Carrega tudo de uma vez e monta na memória para evitar lentidão.
        """
        try:
            # 1. Busca TODOS os usuários
            users_response = supabase.table("users").select("*").execute()
            if not users_response.data:
                return []

            # 2. Busca TODAS as relações user_suppliers
            rels_response = supabase.table("user_suppliers").select("*").execute()
            
            # 3. Busca TODOS os fornecedores
            suppliers_response = supabase.table("suppliers").select("*").execute()

            # --- PROCESSAMENTO EM MEMÓRIA (MUITO RÁPIDO) ---

            # Cria mapa: ID -> Nome do Fornecedor {1: "Timken", 2: "NSK"}
            supplier_map = {}
            if suppliers_response.data:
                for s in suppliers_response.data:
                    # Pega o ID independente do nome da coluna (id ou supplier_id)
                    s_id = s.get("id") or s.get("supplier_id")
                    if s_id:
                        supplier_map[s_id] = s["name"]

            # Cria mapa: UserID -> Lista de Nomes {"user_123": ["Timken", "NSK"]}
            user_suppliers_map = {}
            if rels_response.data:
                for item in rels_response.data:
                    u_id = item["user_id"]
                    s_id = item["supplier_id"]
                    
                    # Se o fornecedor existe no mapa, adiciona à lista do usuário
                    if s_id in supplier_map:
                        if u_id not in user_suppliers_map:
                            user_suppliers_map[u_id] = []
                        user_suppliers_map[u_id].append(supplier_map[s_id])

            # Monta a lista final cruzando os dados
            final_users_list = []
            for u in users_response.data:
                u_id = u["user_id"]
                # Pega a lista do mapa ou vazio se não tiver
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
        """
        Sincroniza fornecedores.
        Busca IDs manualmente para evitar erros de coluna.
        """
        try:
            supabase.table("user_suppliers").delete().eq("user_id", user_id).execute()
            
            if not supplier_names or len(supplier_names) == 0:
                return

            # Busca IDs usando o nome.
            suppliers_response = supabase.table("suppliers").select("*").in_("name", supplier_names).execute()
            
            if not suppliers_response.data:
                return

            records_to_insert = []
            for item in suppliers_response.data:
                # Pega o ID independente do nome da coluna
                found_id = item.get("id") or item.get("supplier_id")
                if found_id:
                    records_to_insert.append({
                        "user_id": user_id,
                        "supplier_id": found_id
                    })

            if records_to_insert:
                supabase.table("user_suppliers").insert(records_to_insert).execute()

        except Exception as e:
            print(f"[ERRO SUPABASE - sync_user_suppliers] {e}")
            raise e

    def get_all_suppliers(self) -> List[str]:
        try:
            response = supabase.table("suppliers").select("name").execute()
            if not response.data:
                return []
            return [item["name"] for item in response.data]
        except Exception as e:
            print(f"[ERRO SUPABASE - get_all_suppliers] {e}")
            return []
        
    def delete_user(self, user_id: str) -> None:
            try:
                    supabase.table("user_suppliers").delete().eq("user_id", user_id).execute()
                    response = supabase.table("users").delete().eq("user_id", user_id).execute()
                    
                    if not response.data:
                        print(f"[AVISO] Usuário {user_id} não encontrado ou já deletado.")

            except Exception as e:
                    print(f"[ERRO SUPABASE - delete_user] {e}")
                    raise e