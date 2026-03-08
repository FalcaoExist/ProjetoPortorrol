# Portorrol

Sistema interno para gestão de pedidos, estoque, fornecedores e auditoria da Portorrol.

## Arquitetura

- **Backend**: FastAPI em `backend/app`, com separação por camadas (`api`, `services`, `repositories`, `core`).
- **Frontend**: React + Vite em `frontend/src`, com páginas, componentes reutilizáveis, hooks e serviços.

## Tecnologias

- Python 3.11 + FastAPI + Uvicorn
- React 19 + Vite + React Router
- Supabase
- Docker + Docker Compose

## Como executar

### Opção recomendada (Docker)

Pré-requisito: arquivo `.env` na raiz do projeto.

```bash
docker compose up --build
```

Serviços disponíveis:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- Docs da API (Swagger): `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Build e execução em produção (Docker)

Foi adicionado um compose dedicado para produção: `docker-compose.prod.yaml`.

1. Ajuste o `.env` da raiz com as variáveis necessárias (backend e frontend).
2. Faça o build das imagens de produção:

```bash
docker compose -f docker-compose.prod.yaml build
```

3. Suba os containers em background:

```bash
docker compose -f docker-compose.prod.yaml up -d
```

4. Acompanhe os logs:

```bash
docker compose -f docker-compose.prod.yaml logs -f
```

5. Para derrubar o ambiente:

```bash
docker compose -f docker-compose.prod.yaml down
```

Serviços em produção:

- Frontend (Nginx): `http://localhost`
- Backend (FastAPI): `http://localhost:8000`

### Dev vs Production (Docker)

Use composes distintos para desenvolvimento e produção para evitar conflitos.

- Dev (hot-reload, frontend com Vite):

```bash
docker compose down
docker compose build frontend
docker compose up
```

Frontend (dev): http://localhost:5173 — Backend: http://localhost:8000

- Prod (build estático + Nginx):

```bash
docker compose -f docker-compose.prod.yaml build
docker compose -f docker-compose.prod.yaml up -d
```

Frontend (prod): http://localhost — Backend: http://localhost:8000

Notas importantes:

- Sempre execute `docker compose down` antes de alternar entre dev e prod.
- Rode `docker compose build frontend` ao trocar o `Dockerfile` ou atualizar dependências.
- Defina `CORS_ORIGINS` no `.env` de produção com os domínios reais do frontend.

### Execução local sem Docker (resumo)

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Documentação do projeto

- Frontend: veja `frontend/README.md`
- Backend: veja `backend/README.md`

## Variáveis de ambiente

As principais variáveis usadas hoje são:

- Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SECRET_KEY`, `ALGORITHM`
- Frontend: `VITE_API_URL`, `VITE_ISDEV`


## Estrutura resumida

```text
backend/
	app/
		api/
		services/
		repositories/
		core/
frontend/
	src/
		pages/
		components/
		hooks/
		services/
        utils/
```

