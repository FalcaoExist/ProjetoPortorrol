from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importa o roteador principal da sua aplicação
from app.api.router import router as api_router

app = FastAPI(title="IBy Backend API", version="1.0.0")

# Adiciona o middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router)


@app.get("/")
def root():
    return {"message": "API rodando!", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "healthy"}