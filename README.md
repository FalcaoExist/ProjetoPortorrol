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

