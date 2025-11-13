import json
import os

import bcrypt
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

app = FastAPI(title="IBy Login API (Modo JSON)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- INÍCIO DA CORREÇÃO ---
# Pega o caminho absoluto para a pasta onde este script (main.py) está
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Define o caminho completo para o arquivo JSON (na mesma pasta do main.py)
DB_FILE = os.path.join(BASE_DIR, "users_rows.json")
# --- FIM DA CORREÇÃO ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    user: dict
    message: str

def get_user_by_email(email: str):
    """Busca o usuário no arquivo users_rows.json"""
    print(f"--- DEBUG (JSON): Buscando usuário: {email} ---")
    print(f"--- DEBUG (JSON): Procurando arquivo em: {DB_FILE} ---") # Novo debug
    try:
        # Usa o caminho absoluto DB_FILE
        with open(DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f) 
            
        for user in data:
            if user.get("email") == email:
                print(f"--- DEBUG (JSON): Usuário {email} encontrado. ---")
                return user
        
        print(f"--- DEBUG (JSON): Usuário {email} NÃO encontrado. ---")
        return None
        
    except FileNotFoundError:
        print(f"*** ERRO: Arquivo {DB_FILE} não encontrado! ***")
        print("*** Certifique-se que 'users_rows.json' está na MESMA pasta do 'main.py' ***")
        raise HTTPException(status_code=500, detail="Banco de dados (JSON) não encontrado.")
    except Exception as e:
        print(f"*** ERRO AO LER O JSON: {e} ***") 
        raise HTTPException(status_code=500, detail=f"Erro ao ler o banco de dados: {e}")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compara senha com hash armazenado"""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

@app.post("/login", response_model=LoginResponse)
def login(data: LoginRequest):
    user = get_user_by_email(data.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos"
        )

    if user.get("status") != "ativo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este usuário está desativado."
        )

    if not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos"
        )

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
        "message": "Login realizado com sucesso (via JSON)"
    }

@app.get("/")
def root():
    return {"message": "Backend rodando com banco de dados JSON!", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy"}