# hackerton-gemini Monorepo

Monorepo with:

- `apps/web`: Next.js frontend
- `apps/api`: Python + FastAPI backend
- root `package.json`: npm workspace orchestration

## Structure

```text
.
├── apps
│   ├── web    # Next.js app
│   └── api    # FastAPI app
└── package.json
```

## Run Web

```bash
npm run dev:web
```

Web runs at `http://localhost:3000`.

## Run API

```bash
npm run dev:api
```

API runs at `http://127.0.0.1:8000`.
Health check: `GET /api/health`

## Combined Dev

Run frontend and backend in separate terminals:

```bash
npm run dev:web
npm run dev:api
```

## API Helper Scripts

- `npm run setup:api`: creates `apps/api/.venv`, installs `requirements.txt`, and creates `.env` from `.env.example` if missing.
- `npm run dev:api`: runs setup automatically, then starts FastAPI with reload.

## Workspace Note

- Workspace mode is enabled at root via `workspaces`.
- If you run `npm install` at repo root, a root-level `node_modules/` is normal behavior for npm workspaces.
- `apps/web/.next` remains inside `apps/web` (build artifact for the web app).
