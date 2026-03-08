# Frontend (React + Vite)

Interface web do sistema Portorrol.

## Stack

- React 19
- Vite
- React Router
- MUI (Material UI)
- TailwindCSS

## Requisitos

- Node.js 18+
- npm 9+

## Como rodar

```bash
npm install
npm run dev
```

Aplicação local: `http://localhost:5173`

## Scripts úteis

- `npm run dev`: sobe ambiente de desenvolvimento
- `npm run build`: gera build de produção
- `npm run preview`: sobe build local para validação
- `npm run lint`: executa lint do projeto

## Variáveis de ambiente

Criar `.env` (ou `.env.local`) no diretório `frontend/`:

```bash
VITE_API_URL=http://localhost:8000
VITE_ISDEV=dev # dev para desenvolvimento
```

## Rotas principais

Definidas em `src/App.jsx`:

- `/` → login
- `/home` → dashboard inicial
- `/stock` → estoque
- `/orders` → pedidos
- `/profile` → perfil
- `/list_users` → gestão de usuários (papel `gestor`)
- `/list_suppliers` → fornecedores (papel `gestor`)
- `/records` → registros/auditoria (papel `gestor`)

## Estrutura de pastas

```text
src/
	pages/          # páginas por rota
	components/     # componentes reutilizáveis
	hooks/          # hooks customizados
	services/       # chamadas HTTP e integrações
	context/        # providers globais (ex.: auth)
	utils/          # utilitários
```
