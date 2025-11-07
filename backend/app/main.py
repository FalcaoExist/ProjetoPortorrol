from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# 1. Comente este import temporariamente
# from app.core.check_credentials import check_credentials_logic 

app = FastAPI(title="IBy Backend REST")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[REQUEST] {request.method} {request.url}")
    response = await call_next(request)
    print(f"[RESPONSE] {response.status_code} {request.url}")
    return response

@app.get("/")
async def root():
    return {"message": "Backend tá voando"}

@app.post("/login")
async def login(data: dict):
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return {"success": False, "message": "Email e senha são obrigatórios"}

    # 2. Comente a lógica real
    # result = check_credentials_logic(email, password)
    
    # 3. Retorne uma mensagem falsa SÓ PARA O TESTE
    print("--- [TESTE] Endpoint /login chamado, pulando lógica do Supabase ---")
    return {"success": False, "user": None, "message": "TESTE: Lógica do Supabase desativada."}