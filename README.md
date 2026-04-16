# Panel de Incidentes

Panel operativo para la revisión y análisis de incidentes de extorsión e inteligencia sobre crimen organizado. Permite a los analistas consultar, filtrar y revisar casos de forma individual con acceso a transcripciones de llamadas, datos del reporte y clasificación del incidente.

---

## Arquitectura

```
React (Vite, puerto 5173)
  └── fetch + react-router-dom
        └── FastAPI (puerto 8000)
              ├── JWT (HS256) — autenticación propia
              ├── CORSMiddleware
              ├── psycopg_pool (conexiones PostgreSQL)
              └── PostgreSQL 16 (Docker, puerto 5433)
                    ├── public   — usuarios, catálogos, vistas base
                    └── analytics — vistas del panel operativo
```

El proyecto comparte la base de datos `bd_089` con el repositorio `Docker-MAS-089` (pipeline de sincronización y dashboard analítico de Streamlit), pero gestiona su propia autenticación y solo lee datos a través de vistas del esquema `analytics`.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Vite, react-router-dom |
| Backend | FastAPI, Python 3.10+, psycopg3, python-jose, bcrypt |
| Base de datos | PostgreSQL 16 |
| Infraestructura | Docker Desktop |
| Autenticación | JWT HS256, tabla `public.users` |

---

## Funcionalidades

- **Autenticación** — Login con JWT, sesión guardada en `localStorage`, redirección automática a `/login` si el token expira o es inválido
- **Panel de filtros** — Consulta de incidentes por rango de fechas, hora, tipo de extorsión o ID exacto
- **Vista de detalle** — Ficha completa del incidente con secciones de identificadores, tiempos, datos del reporte, montos y cuentas
- **Transcripción** — Visualización del diálogo de la llamada en formato de chat (agente / víctima) con marca de tiempo por turno, en panel lateral fijo
- **Roles de usuario** — `admin`, `monitor`, `operativo` con control de acceso en endpoints

---

## Endpoints de la API

Todos los endpoints excepto `/health` y `/auth/login` requieren `Authorization: Bearer <token>`.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/auth/login` | No | Login OAuth2 (form-data) → devuelve JWT + rol |
| `GET` | `/health` | No | Verificación de conectividad con la BD |
| `GET` | `/data` | Sí | Lista incidentes con filtros opcionales |
| `GET` | `/data/{id_conv}` | Sí | Detalle de un incidente por ID |
| `GET` | `/extortion-types` | Sí | Catálogo de tipos de extorsión |
| `POST` | `/users` | Admin | Crear nuevo usuario |

**Parámetros de `/data`:** `fecha`, `fecha_inicio`, `fecha_fin`, `hora`, `minutos`, `tipo_extorsion`, `id_conv`

---

## Roles

| Rol | Acceso |
|---|---|
| `admin` | Panel completo + gestión de usuarios (`POST /users`) |
| `monitor` | Panel completo — solo lectura |
| `operativo` | Panel completo — solo lectura |

---

## Instalación

Ver [QUICKSTART.md](QUICKSTART.md) para instrucciones detalladas paso a paso.

**Resumen:**

```bash
# 1. Base de datos
cd backend/db && docker-compose up

# 2. Backend
cd backend/api
python -m venv .panel
.\.panel\Scripts\Activate.ps1        # Windows PowerShell
# source .panel/bin/activate         # Linux / Mac
pip install -r requirements.txt
python seed_user.py --username admin --password <pass> --role admin
python -m uvicorn main:app --reload

# 3. Frontend
cd frontend
npm install
npm run dev
```

Acceder en `http://localhost:5173`

---

## Variables de entorno

Crear `backend/api/.env` (ver `.env.example`):

```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=bd_089
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET_KEY=<generado con: python -c "import secrets; print(secrets.token_hex(32))">
JWT_EXPIRE_HOURS=8
CORS_ORIGINS=http://localhost:5173
```

---

## Estructura del repositorio

```
panel-incidentes/
├── backend/
│   ├── api/
│   │   ├── main.py            # FastAPI — endpoints, modelos Pydantic, pool
│   │   ├── .env               # Credenciales (nunca commitear)
│   │   └── requirements.txt
│   └── db/
│       ├── migrations/        # SQL aplicados en orden (YYYYMMDD_NNN_desc.sql)
│       └── docker-compose.yml
└── frontend/
    └── src/
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── FiltrosPage.jsx
        │   └── DetalleIncidentePage.jsx
        ├── components/
        │   ├── Sidebar/
        │   └── Filters/
        ├── services/
        │   └── api.js         # Capa de comunicación con el backend
        └── hooks/
            └── useIncidentes.js
```

---

## Gestión de usuarios

Los usuarios se crean con `seed_user.py` (gitignored — cada colaborador lo crea localmente):

```bash
python seed_user.py --username <nombre> --password <contraseña> --role <admin|monitor|operativo>
```

Las contraseñas se almacenan como hashes bcrypt. El endpoint `POST /users` también permite crear usuarios desde el panel si se tiene rol `admin`.
