# Ralph Loop — Implementar SidePreviewPanel (una story por iteración)

Eres un agente autónomo. Implementa **una sola** user story por iteración del
feature "Panel lateral de preview (SidePreviewPanel)".

## Orden obligatorio de cada iteración

1. **Lee primero** `scripts/ralph/progress.txt`, en especial la sección
   "Codebase Patterns". No repitas trabajo ni descubrimientos ya anotados.
2. **Lee** `scripts/ralph/AGENT.md` (convenciones y comandos de validación) y
   `scripts/ralph/specs/side-preview-panel.md` (la spec del feature).
3. **Lee** `scripts/ralph/prd.json` y elige la user story de menor `priority`
   que tenga `"passes": false`. Implementa **solo esa**.
4. **Busca en el código antes de crear nada.** Usa Grep/Glob/Read para confirmar
   qué existe ya (componentes, clases CSS, claves de sessionStorage, helpers).
   NUNCA asumas que un archivo o patrón no existe sin verificarlo. Reutiliza lo
   que ya hay (clase sticky `.preview-panel`, formateadores de fecha, grid
   `.busquedas-layout`, estructura de `aside`).
5. **Implementa la story** respetando las convenciones de AGENT.md:
   - No tocar `backend/` ni la DB ni `services/api.js`.
   - No mostrar estado de asignación ni monitorista.
   - Usa exactamente las claves de sessionStorage de la spec §6.
   - No rompas flujos existentes (checkbox multi-select, restauración de scroll,
     selección de reporte, caches).
   - Nunca commitees `.env`.
6. **Valida** según lo que tocaste (comandos exactos):
   - Frontend (lo normal):
     - `cd frontend && npm run lint`
     - `cd frontend && npm run build`
   - Backend (solo si por error tocaste backend/api):
     - `cd backend/api && python -c "import main"`
   Si la validación falla, **arregla** antes de continuar. No commitees roto.
7. **Actualiza el estado:**
   - En `scripts/ralph/prd.json`: marca la story con `"passes": true` y escribe
     en `notes` un resumen breve de lo implementado.
   - Haz **append** (no sobrescribir) a `scripts/ralph/progress.txt` en la
     sección "Iteration Log": id de la story, qué se hizo, archivos tocados,
     resultado de la validación, y cualquier patrón nuevo en "Codebase Patterns".
8. **Commit** atómico de la story:
   ```
   feat: [US-XXX] - <título exacto del story>
   ```

## Reglas

- **Una story por iteración.** Si la story elegida ya está completa y validada,
  termina; no empieces otra.
- Si todas las stories tienen `"passes": true`, no hagas cambios: reporta que el
  feature está completo y **termina**.
- Cambios mínimos y enfocados; nada fuera del alcance de la story actual.
