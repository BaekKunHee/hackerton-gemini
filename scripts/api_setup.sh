#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
VENV_DIR="$API_DIR/.venv"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required but not found in PATH."
  exit 1
fi

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment at apps/api/.venv"
  python3 -m venv "$VENV_DIR"
fi

echo "Installing Python dependencies"
"$VENV_DIR/bin/pip" install -r "$API_DIR/requirements.txt"

if [ ! -f "$API_DIR/.env" ] && [ -f "$API_DIR/.env.example" ]; then
  cp "$API_DIR/.env.example" "$API_DIR/.env"
  echo "Created apps/api/.env from .env.example"
fi

echo "API setup complete."
