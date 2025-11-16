from fastapi import HTTPException
from app.core.supabase_client import supabase # Importa o cliente inicializado
from .interfaces import IUserRepository
from typing import List, Dict, Any, Optional

class SupabaseUserRepository(IUserRepository):
    """
    Implementação concreta da Interface IUserRepository.
    Esta classe é a única parte do aplicativo que "sabe" como
    interagir com a tabela 'users' no Supabase.

    Responsabilidade: Apenas executar comandos no banco (CRUD) e
    retornar os dados brutos, sem lógica de negócio.
    """

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Busca um único usuário no banco de dados pelo seu e-mail.
        
        :param email: O e-mail a ser buscado.
        :return: Um dicionário com os dados do usuário ou None se não encontrado.
        """
        try:
            # Executa a query: SELECT * FROM users WHERE email = [email]
            response = supabase.table("users").select("*").eq("email", email).execute()

            # .execute() sempre retorna uma lista, mesmo buscando um só
            if not response.data:
                return None
            
            # Retorna o primeiro (e único) usuário encontrado
            return response.data[0]
        
        except Exception as e:
            # Loga o erro real no console do servidor
            print(f"[ERRO SUPABASE get_user_by_email] {e}")
            # Lança uma exceção HTTP genérica para o cliente
            raise HTTPException(status_code=500, detail="Erro ao buscar usuário.")

    def get_all_users(self) -> List[Dict[str, Any]]:
        """
        Busca TODOS os usuários cadastrados no banco de dados.
        
        :return: Uma lista de dicionários, onde cada dicionário é um usuário.
        """
        try:
            # Executa a query: SELECT * FROM users
            response = supabase.table("users").select("*").execute()
            
            return response.data if response.data else []
        
        except Exception as e:
            print(f"[ERRO SUPABASE get_all_users] {e}")
            raise HTTPException(status_code=500, detail="Erro ao buscar usuários.")

    def create_user(self, user_data: dict) -> Dict[str, Any]:
        """
        Insere um novo registro de usuário no banco de dados.
        
        :param user_data: Um dicionário contendo os dados do usuário
                          (já formatado com os nomes das colunas do DB,
                          ex: 'user_id', 'password_hash', 'is_active').
        :return: Um dicionário com os dados do usuário recém-criado.
        """
        try:
            # Executa a query: INSERT INTO users (...) VALUES (...)
            # O 'user_data' já deve vir formatado pelo UserService
            response = supabase.table("users").insert(user_data).execute()
            
            if not response.data:
                raise Exception("Nenhum dado retornado após inserção")

            # Retorna os dados do usuário que acabou de ser inserido
            return response.data[0]
        
        except Exception as e:
            print(f"[ERRO SUPABASE create_user] {e}")
            raise HTTPException(status_code=500, detail=f"Erro ao salvar usuário: {e}")

    def save_user(self, user_data: dict) -> Dict[str, Any]:
        """
        Método de conveniência (alias) para create_user.
        Mantido para compatibilidade caso alguma interface o exija.
        """
        return self.create_user(user_data)