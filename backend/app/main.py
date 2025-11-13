from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

from app.core.hashers import BcryptHasher
from app.core.repositories_supabase import SupabaseUserRepository

#from app.core.repositories import JsonUserRepository
from app.core.services import AuthService

app = FastAPI(title="IBy Login API (Em SOLID)")

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
    message: str


# injeção de dependências
user_repo = SupabaseUserRepository()
#user_repo = JsonUserRepository()
hasher = BcryptHasher()
auth_service = AuthService(user_repo, hasher)


@app.post("/login", response_model=LoginResponse)
def login(data: LoginRequest):
    user = auth_service.check_credentials(data.email, data.password)

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
        "message": "Login realizado com sucesso!",
    }


@app.get("/")
def root():
    return {"message": "Backend rodando com banco de dados Supabase!", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}
