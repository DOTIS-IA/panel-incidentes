# AGENT.md — Instrucciones operacionales del loop

Eres el agente que implementa el feature **SidePreviewPanel** una user story por
iteración. Lee esto y `specs/side-preview-panel.md` antes de tocar nada.

## Stack y cómo levantarlo (referencia — NO es obligatorio levantarlo para validar)

El feature es **frontend-only**. La validación primaria es `lint` + `build`; no
necesitas la DB ni el backend corriendo para validar tus cambios.

- **DB** (solo si necesitas datos reales): `cd backend/db && docker-compose up`
  → PostgreSQL en `localhost:5433`, DB `bd_089`.
- **Backend**: `cd backend/api`, activar venv (`.panel\Scripts\activate` en
  Windows / `source .panel/bin/activate` en Linux), `pip install -r
  requirements.txt`, `python -m uvicorn main:app --reload` → `http://localhost:8000`.
- **Frontend**: `cd frontend && npm install && npm run dev` → `http://localhost:5173`.

## Comandos de validación (EXACTOS)

Según el tipo de archivo que modifiques:

- **Frontend (lo normal en este feature):**
  ```
  cd frontend && npm run lint
  cd frontend && npm run build
  ```
  Ambos deben pasar sin errores antes de commitear.
- **Backend (solo si por error tocaste algo en backend/api):**
  ```
  cd backend/api && python -c "import main"
  ```
  (Requiere el venv activado y dependencias instaladas. No deberías necesitarlo:
  este feature NO toca el backend.)

## Convenciones críticas que DEBES respetar

1. **No tocar el backend ni la DB.** Nada en `backend/`. Sin nuevos endpoints,
   sin cambios en `services/api.js`. Todos los datos del preview ya están en
   memoria (ver spec §5).
2. **No mostrar estado de asignación ni monitorista** en el preview (fuera de
   alcance). Solo: id_conv, fecha, tipo, título, resumen.
3. **Naming de sessionStorage:** usa exactamente las claves de la spec §6
   (`inicio_preview_id`, `asig_preview_id`, `inicio_visitados_panel`,
   `asig_casos_panel`, `asig_resumen_panel`). NO renombres ni rompas claves
   existentes (`inicio_panel`, `inicio_reporte_sel`, `inicio_tab`, `asig_tab`,
   `asig_casos_cache`, `asig_resumen_*`, `inicio_visitados_scroll`).
4. **Roles JWT:** no alteres la lógica de roles ni `ProtectedRoute`. El gating de
   UI por rol (Sidebar, botón "Asignar caso") se mantiene como está.
5. **No romper flujos existentes:** el checkbox de selección múltiple + toolbar de
   asignar en Asignaciones → Casos debe seguir funcionando; la restauración de
   scroll (`*_scroll`) y de búsquedas (`asig_casos_cache`) debe seguir igual.
6. **Nunca commitear `.env`** (ni `backend/api/.env` ni `frontend/.env`).
7. **Reutiliza patrones existentes** (clases CSS sticky `.preview-panel`,
   formateadores de fecha `Intl.DateTimeFormat('es-MX', ...)`, estructura de
   `aside`/grid de `.busquedas-layout`). No reinventes estilos.
8. **Un solo story por iteración.** Commit atómico por story.

## Archivos críticos a LEER antes de modificar

- `scripts/ralph/specs/side-preview-panel.md` — la spec del feature.
- `scripts/ralph/progress.txt` — sección "Codebase Patterns" primero.
- `frontend/src/pages/Inicio.jsx` y `frontend/src/pages/Inicio.css`
- `frontend/src/pages/AsignacionesPage.jsx` y `frontend/src/pages/AsignacionesPage.css`
- `frontend/src/components/AsignarModal/AsignarModal.jsx` (referencia de patrón de componente)
- `frontend/src/services/api.js` (entender shapes, NO modificar)
- `frontend/src/utils/Reportescache.js` (shapes de reportes/historial)

## Definición de "hecho" por iteración

1. El código del story implementado, reutilizando patrones de la codebase.
2. `npm run lint` y `npm run build` pasan en `frontend/`.
3. `prd.json` actualizado: el story con `"passes": true` y `notes` con lo hecho.
4. Append a `progress.txt`: qué se hizo, archivos tocados, patrones nuevos.
5. Commit: `feat: [US-XXX] - <título del story>`.
