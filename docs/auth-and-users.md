# Contrato de autenticacion y usuarios

Estado: canonico
Ultima actualizacion: 2026-05-04
Relacionados: [README](../README.md)

## Proposito

Documentar como `panel-incidentes` usa usuarios compartidos de `MAS_089` sin convertirse en autoridad canonica de usuarios.

## Modelo vigente

El panel mantiene una sesion propia con JWT HS256 para su frontend React. Las credenciales se validan contra la tabla compartida `public.users` de `bd_089`, pero en produccion el rol PostgreSQL del panel solo tiene lectura.

```text
Browser React
  -> POST /api/auth/login
  -> panel-incidentes-api
  -> SELECT public.users WHERE username = ?
  -> bcrypt.checkpw(...)
  -> JWT propio del panel
```

El JWT del panel no es el JWT de `mas089-auth` y no sirve para entrar a `doti-ia.com` ni a `analisis.doti-ia.com`.

## Roles permitidos

| Rol | Resultado en panel |
| --- | --- |
| `admin` | Acceso al panel |
| `monitor` | Acceso al panel |
| `operativo` | Acceso al panel |
| `analisis` | Rechazado con `403` |

El rol `analisis` esta reservado para `https://analisis.doti-ia.com`. Si aparece en un login o en un token enviado a endpoints protegidos, la API debe responder `403`.

## Limite de permisos de base de datos

En produccion el panel usa:

```text
DB_USER=mas089_panel_rw
```

Permisos esperados:

- `SELECT` en `analytics.vw_report_conversation_panel`
- `SELECT` en `public.extortion_type`
- `SELECT` en `public.users` solo para login
- sin acceso a `public.auth_sessions`
- sin `INSERT` sobre `public.users`
- sin acceso a `public.users_id_seq`

`mas089_panel_rw` fue creado por la migracion `20260427_027` del repo principal y endurecido por `20260429_028`, que revoco la escritura directa sobre usuarios.

## Gestion de usuarios

La gestion canonica de usuarios vive en `MAS_089`, a traves de `mas089-auth` y la pestaña Administracion del dashboard principal.

En produccion, este panel no debe crear usuarios directamente en `public.users`. El endpoint `POST /users` queda como compatibilidad legacy; si se reactivara la gestion desde el panel, debe llamar internamente a `/admin/users` de `mas089-auth` en lugar de insertar directo en PostgreSQL.

El script `backend/api/scripts/create_user.py` queda para bootstrap o desarrollo local cuando se usa una cuenta de BD con permisos de escritura. No debe usarse como flujo operativo normal en produccion.

## Validacion operativa

Health del panel:

```bash
curl -fsS https://panel-incidentes.doti-ia.com/api/health
```

Validaciones de frontera:

- login con `admin`, `monitor` u `operativo` activos debe emitir JWT del panel
- login con `analisis` debe responder `403`
- cualquier endpoint protegido con token cuyo payload tenga `role=analisis` debe responder `403`
- `POST /users` no debe considerarse alta canonica en produccion

## Regla de cambios

Si cambia auth o gestion de usuarios, actualizar en la misma tarea:

- `backend/api/main.py`
- `backend/api/scripts/create_user.py`, si aplica
- `README.md`
- este documento
- documentacion canonica relacionada en `MAS_089/docs/`
