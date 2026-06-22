# Spec — Panel lateral de preview (SidePreviewPanel)

> Especificación técnica basada en lectura directa de la codebase (jun 2026).
> El agente del loop DEBE leer este archivo completo antes de tocar código.

## 1. Objetivo

Un panel lateral **sticky** que aparece al seleccionar un caso (incidente) en
las listas de **Registros** (`Inicio.jsx`, pestañas Búsquedas + Visitados) y
**Asignaciones** (`AsignacionesPage.jsx`, pestañas Casos + Resumen). En lugar de
navegar directo a `/incidente/:id`, el clic abre el panel con un preview; desde
el panel un botón **"Ver detalle completo"** navega a la página de detalle.
Convive con la navegación existente, no la reemplaza.

## 2. Decisiones de diseño (confirmadas con el usuario)

1. **Sin datos de asignación en el preview.** El objeto `IncidenteItem` que
   devuelve `/data` NO trae estado de asignación ni monitorista, y la spec
   prohíbe tocar el backend. Por lo tanto el preview muestra **solo**:
   `folio`, `fecha` (event_ts), `procedente` o  `no procedente`,`tipo de extorsión` (extortion_name),
   `título` y `resumen`. Estado/monitorista quedan **fuera de alcance** (versión
   futura), incluso en la pestaña Resumen donde el dato sí existiría.
2. **Inicio → Búsquedas: integrar dentro del panel de reporte existente.** Ya
   existe un panel (`.preview-panel`) que previsualiza el REPORTE (lista de
   incidentes de una búsqueda guardada). Se mantiene ese panel; al hacer clic en
   un incidente de su lista, en vez de navegar, se muestra el preview de ese
   incidente con el botón "Ver detalle completo".
3. **Asignaciones: ambas pestañas.** Casos (clic en tarjeta abre preview SIN
   romper el checkbox de selección múltiple para asignar) y Resumen (clic en fila
   abre preview).
4. **Toggle por página/pestaña.** Cada lista mantiene/recibe su propio toggle
   on/off del panel, persistido en sessionStorage; el panel arranca visible.
   Sigue el patrón actual de `panelVisible` (`inicio_panel`).

## 3. Componente nuevo

**Ubicación:** `frontend/src/components/SidePreviewPanel/SidePreviewPanel.jsx`
+ `frontend/src/components/SidePreviewPanel/SidePreviewPanel.css`

(Sigue la convención de carpeta-por-componente ya usada en
`components/AsignarModal/` y `components/Sidebar/`.)

**Contrato (props):**

```jsx
<SidePreviewPanel
  data={incidenteOAsignacion}   // objeto crudo o null
  onClose={() => ...}           // limpia la selección
  onVerDetalle={(idConv) => ...}// navega a /incidente/:idConv
/>
```

- `data`: objeto incidente crudo. Puede tener forma de **`IncidenteItem`**
  (clave de id = `id_conv_eleven`) o de **`AsignacionCoordinador`**
  (clave de id = `id_conv`). El panel normaliza internamente con fallbacks —
  NO se necesitan props separadas por cada campo.
- Si `data` es `null`/`undefined`, el panel renderiza el estado vacío
  ("Selecciona un caso para ver su preview").

**Normalización interna (con fallbacks, sin fetch):**

| Campo preview | Origen (con fallback) |
|---------------|-----------------------|
| `idConv`  | `data.id_conv_eleven ?? data.id_conv` |
| `fecha`   | `data.event_ts` → formatear con `Intl.DateTimeFormat('es-MX', { dateStyle:'medium', timeStyle:'short' })` |
| `tipo`    | `data.extortion_name` → fallback `'Sin tipo'` |
| `titulo`  | `data.title ?? idConv` |
| `resumen` | `data.summary` → fallback `'Sin resumen disponible.'` |
| `folio`   | `data.folio` (opcional, ocultar si no existe) |
| `agente`  | `data.agent_name ?? data.id_agent ?? 'N/A'` (opcional) |

**Render:**
- Botón **X** arriba a la derecha → `onClose()`.
- Header: badge de `tipo` + `fecha`.
- Cuerpo: `idConv`, `titulo`, `resumen`, `folio` (si hay), `agente` (si hay).
- Botón **"Ver detalle completo"** → `onVerDetalle(idConv)`.
- Manejo elegante de campos faltantes (nunca crashea con `data` parcial).

**Estilo sticky:** reutilizar el patrón existente de `Inicio.css`
(`.preview-panel { position: sticky; top: 24px }` con fallback responsivo
`position: static`). El CSS del componente puede definir su propia clase
(p. ej. `.side-preview-panel`) que replique ese comportamiento sticky para ser
independiente de la página que lo monta.

## 4. Archivos existentes a modificar

### 4.1 `frontend/src/pages/Inicio.jsx` (+ `Inicio.css`)

**Pestaña Búsquedas (integración en panel de reporte):**
- Hoy: seleccionar reporte → `.preview-panel` lista sus incidentes
  (`.preview-incidente`); clic en incidente → `navigate('/incidente/:id')`.
- Cambio: introducir estado de incidente seleccionado (id = `id_conv_eleven`)
  persistido en `sessionStorage` con clave **`inicio_preview_id`**. Al hacer clic
  en un incidente de la lista del panel, en vez de navegar, se selecciona y se
  muestra `<SidePreviewPanel>` (puede reemplazar la lista dentro del mismo
  `aside` con un afford de "volver a la lista", o renderizarse en su lugar).
  `onVerDetalle` hace el `navigate`. `onClose` limpia `inicio_preview_id`.
- El reporte seleccionado sigue usando su clave actual `inicio_reporte_sel`
  (no se toca).

**Pestaña Visitados (panel nuevo):**
- Hoy: lista de visitados (`.incidente-row--standalone`); clic → navega
  (guardando `inicio_visitados_scroll`).
- Cambio: añadir layout lista + panel (reutilizar `.busquedas-layout`/`con-panel`
  o equivalente), un toggle propio persistido en **`inicio_visitados_panel`**
  (default visible), y selección de incidente con la misma clave
  **`inicio_preview_id`**. Clic en visitado → selecciona y muestra preview;
  `onVerDetalle` navega preservando el `inicio_visitados_scroll` actual.
- **Importante:** al cambiar de pestaña, limpiar `inicio_preview_id` para evitar
  que un id seleccionado en una pestaña aparezca en la otra. Al restaurar desde
  sessionStorage, validar que el id exista en la lista de la pestaña activa.

### 4.2 `frontend/src/pages/AsignacionesPage.jsx` (+ `AsignacionesPage.css`)

**Pestaña Casos:**
- Hoy: `.caso-asig-card` con checkbox (multi-select para asignar) + `onClick` del
  card que navega. El checkbox ya hace `stopPropagation`.
- Cambio: añadir layout lista + panel sticky (clases nuevas en
  `AsignacionesPage.css`, no existe panel ahí), toggle propio
  **`asig_casos_panel`** (default visible), y selección con clave
  **`asig_preview_id`**. El `onClick` del card pasa de `navigate` a seleccionar
  para preview. **El checkbox de selección múltiple debe seguir funcionando** (no
  romper el flujo de "Asignar seleccionados" ni la toolbar flotante).
  `onVerDetalle` → `navigate('/incidente/:id_conv_eleven')`.

**Pestaña Resumen:**
- Hoy: `.resumen-tabla` con filas que navegan (guardando `asig_resumen_scroll`).
- Cambio: añadir panel sticky junto a la tabla, toggle propio
  **`asig_resumen_panel`** (default visible), selección con la misma clave
  **`asig_preview_id`**. Clic en fila → selecciona y muestra preview (sin
  `summary` disponible en `AsignacionCoordinador` → el panel muestra "Sin resumen
  disponible." sin romperse). `onVerDetalle` navega preservando
  `asig_resumen_scroll`.
- Limpiar `asig_preview_id` al cambiar de pestaña; validar el id al restaurar.

### 4.3 No se modifican

`App.jsx`, `DetalleIncidentePage.jsx`, `services/api.js`, `MisCasosPage.jsx`,
`FiltrosPage.jsx`, `utils/Reportescache.js`, ni nada en `backend/` o la DB.

## 5. Origen de los datos del preview (sin fetch nuevo)

Todos los contextos ya tienen el objeto en memoria; el panel NO hace fetch:

| Contexto | Fuente del objeto | id | summary disponible |
|----------|-------------------|----|----|
| Inicio → Búsquedas | `reporte.resultados[]` (localStorage, forma IncidenteItem) | `id_conv_eleven` | sí |
| Inicio → Visitados | `obtenerHistorial()[]` (localStorage, forma IncidenteItem) | `id_conv_eleven` | sí |
| Asignaciones → Casos | `incidentesService.getAll({folio})` (IncidenteItem, SELECT *) | `id_conv_eleven` | sí |
| Asignaciones → Resumen | `assignmentsService.getAll()` (AsignacionCoordinador) | `id_conv` | **no** (ausente) |

## 6. Convención de sessionStorage

Sigue el patrón existente `<page>_<key>`:

| Clave | Tipo | Uso |
|-------|------|-----|
| `inicio_preview_id` | string (id_conv_eleven) | incidente seleccionado en Inicio (Búsquedas o Visitados) |
| `inicio_visitados_panel` | "true"/"false" | toggle del panel en Visitados |
| `asig_preview_id` | string (id_conv) | incidente seleccionado en Asignaciones (Casos o Resumen) |
| `asig_casos_panel` | "true"/"false" | toggle del panel en Asignaciones → Casos |
| `asig_resumen_panel` | "true"/"false" | toggle del panel en Asignaciones → Resumen |

**No tocar** las claves ya existentes: `inicio_panel`, `inicio_reporte_sel`,
`inicio_tab`, `inicio_visitados_scroll`, `asig_tab`, `asig_casos_cache`,
`asig_resumen_*`.

## 7. Fuera de alcance

- Acciones inline desde el panel (asignar, marcar visto). Versión futura.
- Mostrar estado de asignación / monitorista en el preview.
- Cambios en `DetalleIncidentePage.jsx`.
- Cambios en backend (`main.py`, endpoints, modelos) o base de datos.
- Nuevos endpoints o cambios en `services/api.js`.
- Tests unitarios/e2e (la validación es `npm run lint` + `npm run build`).
