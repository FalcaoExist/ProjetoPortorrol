# Backend (FastAPI)

API principal do sistema Portorrol, responsável por autenticação, regras de negócio e acesso aos dados.

## Stack

- Python 3.11
- FastAPI
- Uvicorn
- Supabase SDK
- Pandas/OpenPyXL (importações)

## Como rodar

### Com Docker (recomendado)

Subir pela raiz do projeto:

```bash
docker compose up --build
```

API disponível em `http://localhost:8000`.

### Local (sem Docker)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Documentação da API

Com a API rodando:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints de saúde

- `GET /` retorna status geral da API
- `GET /health` retorna status simplificado para monitoramento

## Organização do código

```text
app/
  api/
    router.py      # agrega todos os routers
    routers/       # módulos de rota por domínio
  services/        # regras de negócio
  repositories/    # acesso a dados
  core/            # segurança, dependências, clientes externos
  audit/           # formatação e ações de auditoria
```

Routers registrados atualmente em `app/api/router.py`:

- `auth_router`
- `users_router`
- `suppliers_router`
- `orders_router`
- `stock_router`
- `dashboard_router`
- `import_router`
- `audit_router`
- `demand_router`

## Variáveis de ambiente

Defina no `.env` da raiz (ou exporte no ambiente):

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SECRET_KEY=
ALGORITHM=HS256
```
