#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"

"$ROOT_DIR/scripts/api_setup.sh"

echo "Starting FastAPI dev server on http://127.0.0.1:8000"
cd "$API_DIR"
exec "$API_DIR/.venv/bin/uvicorn" app.main:app --reload
