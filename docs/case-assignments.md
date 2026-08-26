# Asignación de casos y notificaciones por correo

Estado: canonico
Ultima actualizacion: 2026-08-26
Relacionados: [auth-and-users](auth-and-users.md), [README](../README.md)

## Proposito

Documentar cómo un `coordinador_incidentes` asigna casos a monitoristas, cómo el monitorista los trabaja, y qué correos dispara cada paso.

## Roles involucrados

| Rol | Puede |
| --- | --- |
| `admin`, `coordinador_incidentes` | Asignar casos, ver todas las asignaciones (`GET /assignments`) |
| `monitorista_incidentes` | Ver sus asignaciones (`GET /assignments/me`), marcarlas como vistas |

`require_coordinador_o_admin` y los checks de rol `monitorista_incidentes` viven en `backend/api/main.py`.

## Modelo de datos

Tabla `public.case_assignments` (migración `20260507_013_create_case_assignments.sql`):

```text
id              SERIAL PK
id_conv         VARCHAR(50)   -- id_conv_eleven del incidente
assigned_to     INTEGER FK -> public.users(id)
assigned_by     INTEGER FK -> public.users(id)
assigned_at     TIMESTAMPTZ DEFAULT NOW()
status          VARCHAR(20)   -- 'asignado' | 'visto'
seen_at         TIMESTAMPTZ
```

No hay borrado de asignaciones: el historial completo queda en la tabla. Un mismo `id_conv` puede tener varias filas (una por monitorista asignado, o repetida en el tiempo si se reasigna).

## Flujo — coordinador asigna un caso

```text
DetalleIncidentePage / AsignacionesPage (tab Casos)
  -> botón "Asignar caso" (oculto para monitoristas)
  -> AsignarModal: carga monitoristas activos vía GET /users?role=monitorista_incidentes
  -> usuario marca uno o más monitoristas y confirma
  -> POST /assignments  { id_conv, monitoristas: [usernames] }
```

`POST /assignments` (`main.py:create_assignments`), en este orden:

1. Verifica que `id_conv` exista en `analytics.vw_report_conversation_panel` → 404 si no.
2. Resuelve `monitoristas` a filas de `public.users`, exige que existan, estén `is_active = true` y tengan `role = 'monitorista_incidentes'` → 400 si no.
3. Por cada monitorista, si ya existe una asignación **activa** (`status = 'asignado'`) para ese mismo `id_conv` + usuario, la omite silenciosamente (no duplica). El frontend detecta estas omisiones comparando la respuesta contra lo solicitado y las muestra en el modal como "omitida — ya existía".
4. Inserta una fila por cada combinación nueva y hace commit.
5. **Fuera de la transacción de BD**, envía un correo (`send_asignacion_email`) a cada monitorista que sí recibió una asignación nueva.

`AsignarModal` puede asignar varios `id_conv` a la vez (selección múltiple en `AsignacionesPage`): dispara un `POST /assignments` por cada `id_conv`, en paralelo.

## Flujo — monitorista trabaja un caso

```text
MisCasosPage (tabs Asignado / Visto)
  -> GET /assignments/me?status=asignado|visto
  -> clic en un caso "asignado" -> navigate('/incidente/:id', { state: { assignmentId } })
  -> DetalleIncidentePage muestra botón "Marcar como visto" (solo si viene assignmentId en location.state)
  -> PATCH /assignments/{assignment_id}/visto
  -> status pasa a 'visto', seen_at = NOW()
  -> vuelve a MisCasosPage
```

`marcar_visto` valida que la asignación pertenezca al usuario autenticado (`assigned_to = user_id`) antes de actualizarla — un monitorista no puede marcar como vista una asignación ajena. Un caso "visto" no se puede revertir a "asignado" desde la UI ni la API.

## Flujo — coordinador revisa el resumen

`AsignacionesPage`, tab "Resumen" → `GET /assignments`, filtrable por `status` y `monitorista` (query params). Devuelve todas las asignaciones de todos los monitoristas, con el nombre de quien asignó y quien recibió.

## Correos

Ambos viven en `backend/api/email_service.py` y usan plantillas HTML de `email_templates.py`. El envío es **no-op silencioso** si `SMTP_USER`/`SMTP_PASSWORD` no están configurados (loguea y regresa `False`, no lanza excepción) — así que en dev sin SMTP configurado la asignación funciona igual, solo no llega el correo.

### 1. Notificación de asignación (inmediata)

- Disparada por `send_asignacion_email(to, username, id_conv)` dentro de `create_assignments`, una vez por cada asignación nueva que sí se insertó (las omitidas por duplicado no generan correo).
- Si falla el envío (SMTP caído, credenciales inválidas), no revierte la asignación — el `INSERT` ya hizo `commit()` antes de intentar el correo.

### 2. Digest diario para coordinadores

- Programado en el `lifespan` de `main.py` con `APScheduler` (`BackgroundScheduler`), cron diario a `DIGEST_HOUR:00 UTC` (default `8`, configurable vía env `DIGEST_HOUR`).
- `enviar_digest_coordinadores(pool)`: consulta `analytics.vw_report_conversation_panel` por incidentes con `event_ts >= ahora - 24h`, arma un resumen y lo envía a todos los `public.users` con `role = 'coordinador_incidentes' AND is_active = true`.
- Si no hay incidentes nuevos o no hay coordinadores activos, no envía nada (solo loguea).
- No tiene relación con `case_assignments` — es un resumen de incidentes nuevos, no de asignaciones pendientes.

## Endpoints

| Method | Path | Auth | Descripción |
| --- | --- | --- | --- |
| `POST` | `/assignments` | Coordinador/Admin | Asigna un `id_conv` a una lista de monitoristas; dispara correo por cada asignación nueva |
| `GET` | `/assignments` | Coordinador/Admin | Lista todas las asignaciones, filtrable por `status`, `monitorista` |
| `GET` | `/assignments/me` | Monitorista | Asignaciones del usuario autenticado, filtrable por `status` |
| `PATCH` | `/assignments/{id}/visto` | Monitorista (dueño) | Marca la asignación como vista |
| `GET` | `/users?role=monitorista_incidentes` | Coordinador/Admin | Catálogo de monitoristas activos para el modal de asignación |

## Reglas de cambios

Si cambia el flujo de asignación o de correos, actualizar en la misma tarea:

- `backend/api/main.py` (endpoints `/assignments*`)
- `backend/api/email_service.py` / `email_templates.py`
- `frontend/src/components/AsignarModal/`, `frontend/src/pages/MisCasosPage.jsx`, `frontend/src/pages/AsignacionesPage.jsx`
- este documento
