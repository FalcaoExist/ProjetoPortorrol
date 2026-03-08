# app/core/security.py
import os
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
from jose import jwt

load_dotenv()

# Configurações (Mesmas do dependencies.py)
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY deve ser definida nas variáveis de ambiente. Não use valor default em produção.")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Gera um token JWT com tempo de expiração.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Padrão: 5 horas se não especificado
        expire = datetime.utcnow() + timedelta(minutes=600)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt