# PEGA OS DADOS DO JSON

import json
import os

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
