#!/usr/bin/env bash
set -euo pipefail

# ─── colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }
info() { echo -e "${CYAN}▶${NC} $*"; }

# ─── rutas ────────────────────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend/api"
FRONTEND="$ROOT/frontend"
DB_COMPOSE="$ROOT/backend/db"

BACKEND_PID=""
FRONTEND_PID=""

# ─── limpieza al salir ────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Deteniendo servicios..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  docker compose -f "$DB_COMPOSE/docker-compose.yml" stop 2>/dev/null || true
  echo "Servicios detenidos."
}
trap cleanup INT TERM

echo ""
echo "──────────────────────────────────────────"
echo "  Panel Incidentes — entorno local"
echo "──────────────────────────────────────────"
echo ""

# ─── prerrequisitos ───────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || die "Docker no encontrado"
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 no encontrado"
command -v python  >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 || die "Python no encontrado"
command -v node    >/dev/null 2>&1 || die "Node.js no encontrado"
command -v npm     >/dev/null 2>&1 || die "npm no encontrado"

# ─── .env del backend ─────────────────────────────────────────────────────────
if [[ ! -f "$BACKEND/.env" ]]; then
  die ".env no encontrado en backend/api/\n  Copia backend/api/.env.example y rellena los valores"
fi

# ─── entorno virtual ──────────────────────────────────────────────────────────
# Windows (Git Bash): Scripts/activate  |  Linux/Mac: bin/activate
if [[ -f "$BACKEND/.panel/Scripts/activate" ]]; then
  VENV_ACTIVATE="$BACKEND/.panel/Scripts/activate"
elif [[ -f "$BACKEND/.panel/bin/activate" ]]; then
  VENV_ACTIVATE="$BACKEND/.panel/bin/activate"
else
  die "Entorno virtual no encontrado en backend/api/.panel/\n  Créalo con: python -m venv .panel && pip install -r requirements.txt"
fi

# ─── 1. Base de datos ─────────────────────────────────────────────────────────
info "[1/3] Levantando base de datos (Docker)..."
docker compose -f "$DB_COMPOSE/docker-compose.yml" up -d
ok "PostgreSQL disponible en localhost:5433"

# ─── 2. Backend ───────────────────────────────────────────────────────────────
info "[2/3] Iniciando API (FastAPI)..."
cd "$BACKEND"
# shellcheck disable=SC1090
source "$VENV_ACTIVATE"
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
ok "API disponible en http://localhost:8000  (docs: /docs)"

# ─── 3. Frontend ──────────────────────────────────────────────────────────────
info "[3/3] Iniciando frontend (Vite)..."
if [[ ! -d "$FRONTEND/node_modules" ]]; then
  warn "node_modules no encontrado — ejecutando npm install..."
  cd "$FRONTEND" && npm install
fi
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!
ok "Frontend disponible en http://localhost:5173"

echo ""
echo "  Ctrl+C para detener todo."
echo ""

wait "$BACKEND_PID" "$FRONTEND_PID"
