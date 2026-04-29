#!/usr/bin/env bash
set -euo pipefail

# ─── colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

echo "──────────────────────────────────────────"
echo "  Panel Incidentes — despliegue"
echo "──────────────────────────────────────────"

# ─── 1. ubicación ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── 2. prerrequisitos ────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || die "Docker no encontrado"
docker compose version >/dev/null 2>&1 || die "Docker Compose v2 no encontrado (usa 'docker compose', no 'docker-compose')"

# ─── 3. redes externas ────────────────────────────────────────────────────────
for net in mas089_mas089-net database_default; do
  if docker network inspect "$net" >/dev/null 2>&1; then
    ok "Red $net encontrada"
  else
    die "Red Docker '$net' no existe — asegúrate de que el stack MAS-089 esté corriendo"
  fi
done

# ─── 4. archivo .env ──────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  die ".env no encontrado en $(pwd)\n  Crea el archivo con: cp .env.example .env  y rellena los valores"
fi

# variables obligatorias no vacías
for var in DB_PASSWORD JWT_SECRET_KEY; do
  val=$(grep -E "^${var}=" .env | cut -d= -f2- | tr -d '[:space:]' || true)
  [[ -n "$val" ]] || die "$var está vacío en .env"
done
ok ".env validado"

# ─── 5. actualizar código ─────────────────────────────────────────────────────
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Actualizando código..."
  git pull --ff-only
  ok "git pull completado"
else
  warn "No es un repositorio git — omitiendo git pull"
fi

# ─── 6. build y arranque ──────────────────────────────────────────────────────
echo "Construyendo y levantando contenedores..."
docker compose up -d --build

# ─── 7. estado final ──────────────────────────────────────────────────────────
echo ""
docker compose ps
echo ""
ok "Despliegue completado"
echo "  Panel: https://panel-incidentes.doti-ia.com"
echo "  API:   https://panel-incidentes.doti-ia.com/api/health"
