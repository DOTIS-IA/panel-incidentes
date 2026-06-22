#!/usr/bin/env bash
#
# Ralph Loop — implementa SidePreviewPanel una story por iteración.
#
# Uso:
#   ./scripts/ralph/ralph.sh [MAX_ITER]
#
#   MAX_ITER  número máximo de iteraciones (default 5)
#
# Condición de parada: todas las user stories de prd.json tienen "passes": true,
# o se alcanza MAX_ITER.

set -euo pipefail

MAX_ITER="${1:-5}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD="$SCRIPT_DIR/prd.json"
PROMPT="$SCRIPT_DIR/prompt.md"

if [[ ! -f "$PRD" ]];    then echo "❌ No se encontró $PRD";    exit 1; fi
if [[ ! -f "$PROMPT" ]]; then echo "❌ No se encontró $PROMPT"; exit 1; fi

pendientes() {
  # Cuenta cuántas stories tienen "passes": false (tolerante a espacios).
  grep -Eo '"passes"[[:space:]]*:[[:space:]]*false' "$PRD" | wc -l | tr -d ' '
}

for (( i=1; i<=MAX_ITER; i++ )); do
  P="$(pendientes)"
  if [[ "$P" -eq 0 ]]; then
    echo "✅ Todas las user stories tienen passes:true. Loop terminado."
    exit 0
  fi

  echo "──────────────────────────────────────────────────────────"
  echo "🔁 Iteración $i/$MAX_ITER — $P story(s) pendiente(s)"
  echo "──────────────────────────────────────────────────────────"

  claude -p --dangerously-skip-permissions --model claude-sonnet-4-6 "$(cat "$PROMPT")"

  sleep 3
done

P="$(pendientes)"
if [[ "$P" -eq 0 ]]; then
  echo "✅ Todas las user stories completadas."
else
  echo "⏹ Alcanzado MAX_ITER=$MAX_ITER. Stories pendientes: $P"
fi
