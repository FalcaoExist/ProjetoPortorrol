# PEGA OS DADOS DO JSON

import os
import json
from fastapi import HTTPException
from .interfaces import IUserRepository

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_FILE = os.path.join(BASE_DIR, "users_rows.json")


class JsonUserRepository(IUserRepository):
    """Repositório de usuários baseado em arquivo JSON."""

    def get_user_by_email(self, email: str):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)

            for user in data:
                if user.get("email") == email:
                    return user

            return None

        except FileNotFoundError:
            raise HTTPException(status_code=500, detail="Banco de dados (JSON) não encontrado.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao ler o banco de dados: {e}")

    def get_all_users(self):
        """Retorna todos os usuários do banco de dados."""
        try:
            if not os.path.exists(DB_FILE):
                return []
            
            with open(DB_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            return data

        except FileNotFoundError:
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao ler o banco de dados: {e}")

    def create_user(self, user_data: dict):
        """Adiciona um novo usuário ao banco de dados."""
        try:
            # Ler usuários existentes
            if os.path.exists(DB_FILE):
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    users = json.load(f)
            else:
                users = []

            # Adicionar novo usuário
            users.append(user_data)

            # Salvar de volta no arquivo
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(users, f, indent=2, ensure_ascii=False)

            return user_data

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao salvar usuário: {e}")

    def save_user(self, user_data: dict):
        """Alias para create_user (compatibilidade)."""
        return self.create_user(user_data)