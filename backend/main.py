import os
import logging
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from supabase import Client, create_client

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('login_attempts.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos no .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI(title="IBy Login API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    user: dict
    message: str = ""

def log_login_attempt(email: str, success: bool, reason: str = ""):
    """Registra tentativa de login no log"""
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "email": email,
        "success": success,
        "reason": reason
    }
    
    if success:
        logger.info(f"Login bem-sucedido: {email}")
    else:
        logger.warning(f"Tentativa de login falhou: {email} - Motivo: {reason}")
    
    # Opcional: Salvar no Supabase para auditoria
    try:
        supabase.table("login_attempts").insert({
            "email": email,
            "success": success,
            "reason": reason,
            "timestamp": datetime.now().isoformat()
        }).execute()
    except Exception as e:
        logger.error(f"Erro ao salvar log no banco: {e}")

def check_user_status(user_id: str) -> tuple[bool, str]:
    """
    Verifica se o usuário está ativo no sistema.
    Retorna (is_active, reason)
    """
    try:
        # Busca o status do usuário na tabela users
        response = supabase.table("users").select("status, email").eq("id", user_id).execute()
        
        if not response.data:
            return False, "Usuário não encontrado no sistema"
        
        user_data = response.data[0]
        
        # Verifica se o usuário está ativo
        if user_data.get("status") != "ativo":
            return False, "Usuário desativado"
        
        return True, ""
    except Exception as e:
        logger.error(f"Erro ao verificar status do usuário: {e}")
        return False, "Erro ao verificar status"

def check_credentials(email: str, password: str) -> tuple[dict | None, str]:
    """
    Verifica as credenciais do usuário no Supabase.
    Retorna (user_data, error_reason)
    """
    try:
        # Autentica o usuário usando Supabase Auth
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if not response.user:
            return None, "Credenciais inválidas"
        
        # Verifica se o usuário está ativo
        is_active, reason = check_user_status(response.user.id)
        
        if not is_active:
            return None, reason
        
        user_data = {
            "id": response.user.id,
            "email": response.user.email,
            "name": response.user.user_metadata.get("name", ""),
        }
        
        return user_data, ""
        
    except Exception as e:
        error_msg = str(e).lower()
        
        # Não revelar detalhes específicos do erro
        if "invalid" in error_msg or "credentials" in error_msg:
            return None, "Credenciais inválidas"
        
        logger.error(f"Erro ao autenticar: {e}")
        return None, "Erro na autenticação"

@app.post("/login", response_model=LoginResponse)
def login(data: LoginRequest):
    """
    Endpoint de login com validação de credenciais e status do usuário.
    
    Retorna mensagem genérica em caso de falha para manter segurança.
    """
    user, error_reason = check_credentials(data.email, data.password)
    
    if not user:
        # Registra tentativa falha no log
        log_login_attempt(data.email, success=False, reason=error_reason)
        
        # Mensagem genérica baseada no tipo de erro
        if error_reason == "Usuário desativado":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este usuário está desativado. Contate o administrador."
            )
        
        # Mensagem genérica para credenciais inválidas (segurança)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos"
        )
    
    # Registra login bem-sucedido
    log_login_attempt(data.email, success=True)
    
    return {
        "success": True,
        "user": user,
        "message": "Login realizado com sucesso"
    }

@app.get("/")
def root():
    """Health check"""
    return {"message": "Backend rodando com Supabase!", "status": "ok"}

@app.get("/health")
def health():
    """Verifica se o servidor está funcionando"""
    return {"status": "healthy"}