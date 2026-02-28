# API (FastAPI)

## Quick Start (from repo root)

```bash
npm run dev:api
```

This command does all setup automatically:

- create `apps/api/.venv` if missing
- install dependencies from `requirements.txt`
- create `.env` from `.env.example` if missing
- start `uvicorn app.main:app --reload`

## Manual Setup

```bash
cd apps/api
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
cp .env.example .env
./.venv/bin/uvicorn app.main:app --reload
```

Health check:

- `GET http://127.0.0.1:8000/api/health`
