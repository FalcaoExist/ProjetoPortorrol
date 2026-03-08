import logging
from fastapi import FastAPI
from fastapi.openapi.docs import get_redoc_html
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import router as api_router

app = FastAPI(title="IBy Backend API", version="1.0.0", redoc_url=None)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

@app.get(
    "/",
    summary="Root",
    description="Endpoint raiz da API para verificação rápida de disponibilidade.",
    responses={
        200: {
            "description": "API online",
            "content": {
                "application/json": {
                    "example": {"message": "API Segura Online", "status": "ok"}
                }
            },
        }
    },
)
def root():
    return {"message": "API Segura Online", "status": "ok"}

@app.get(
    "/health",
    summary="Health",
    description="Endpoint de health check para monitoramento.",
    responses={
        200: {
            "description": "Serviço saudável",
            "content": {
                "application/json": {
                    "example": {"status": "healthy"}
                }
            },
        }
    },
)
def health():
    return {"status": "healthy"}


@app.get("/redoc", include_in_schema=False)
def redoc_html():
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - ReDoc",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@2/bundles/redoc.standalone.js",
    )