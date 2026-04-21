# Guía de inicio rápido

Cómo montar el proyecto desde cero en un entorno local.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Python | 3.10+ | `python --version` |
| Node.js | 20.19+ ó 22.12+ | `node --version` |
| Docker Desktop | Cualquier reciente | `docker --version` |
| Git | Cualquier | `git --version` |

> Si tienes Node 20.14 o menor, actualiza a Node 22 LTS antes de continuar — Vite 8 lo requiere.

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/DOTIS-IA/panel-incidentes.git
cd panel-incidentes
```

### Normalizar line endings (solo la primera vez en Windows)

El proyecto incluye un `.gitattributes` que fuerza LF en scripts `.sh` y `.sql`. Después de clonar, ejecuta:

```bash
git rm --cached -r .
git reset --hard HEAD
```

Esto evita que `bootstrap_db.sh` falle dentro del contenedor Linux.

---

## Paso 2 — Base de datos (Docker)

```bash
cd backend/db
docker-compose up
```

Espera a ver en la terminal:

```
db-bootstrap-1  | Applying 000_schema_create.sql ...
db-bootstrap-1  | Applying 20260407_001_add_users_auth.sql ...
db-bootstrap-1  | All migrations applied.
db-bootstrap-1 exited with code 0
```

Esto levanta PostgreSQL en el puerto **5433** y aplica todas las migraciones automáticamente.

> Puedes dejarlo corriendo en esta terminal o usar `docker-compose up -d` para correrlo en segundo plano.

---

## Paso 3 — Backend (FastAPI)

Abre una terminal nueva.

### 3.1 — Crear el archivo `.env`

```bash
cd backend/api
cp .env.example .env
```

Edita `.env` y genera la clave JWT:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copia el resultado en `JWT_SECRET_KEY=`. El archivo debe quedar así:

```
DB_HOST=localhost
DB_PORT=5433
DB_NAME=bd_089
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET_KEY=<el valor que generaste>
JWT_EXPIRE_HOURS=8
CORS_ORIGINS=http://localhost:5173
```

### 3.2 — Crear el entorno virtual

```bash
# Desde backend/api/
python -m venv .panel
```

### 3.3 — Activar el entorno e instalar dependencias

**Windows:**
```bash
.panel\Scripts\activate
```

**Linux / Mac:**
```bash
source .panel/bin/activate
```

Luego:
```bash
pip install -r requirements.txt
```

### 3.4 — Crear el primer usuario admin

```bash
python seed_user.py --username admin --password <tu_contraseña> --role admin
```

> `seed_user.py` está en `.gitignore` — cada colaborador lo crea localmente.

### 3.5 — Levantar la API

```bash
python -m uvicorn main:app --reload
```

Verifica que funciona:
```
http://localhost:8000/health  → {"status":"ok","db":"connected"}
http://localhost:8000/docs    → Swagger UI con todos los endpoints
```

---

## Paso 4 — Frontend (React)

Abre una terminal nueva.

### 4.1 — Crear el archivo `.env`

```bash
cd frontend
```

Crea el archivo `frontend/.env`:

```
VITE_API_URL=http://localhost:8000
```

> Sin este archivo el frontend apunta a `http://localhost:8003` y todas las peticiones fallarán con `ERR_CONNECTION_REFUSED`.

### 4.2 — Instalar y arrancar

```bash
npm install
npm run dev
```

El frontend corre en `http://localhost:5173`.

---

## Paso 5 — Primer login

1. Abre `http://localhost:5173`
2. Te redirige automáticamente a `/login`
3. Ingresa el usuario y contraseña que creaste en el Paso 3.4
4. El token se guarda en el navegador y accedes al panel

---

## Resumen — tres terminales

| Terminal | Directorio | Comando |
|---|---|---|
| 1 — BD | `backend/db` | `docker-compose up` |
| 2 — API | `backend/api` | `python -m uvicorn main:app --reload` |
| 3 — Frontend | `frontend` | `npm run dev` |

---

## Solución de problemas comunes

**`ERR_CONNECTION_REFUSED` en todas las peticiones**
→ Falta el archivo `frontend/.env` con `VITE_API_URL=http://localhost:8000`. Créalo y reinicia Vite.

**`503 Service Unavailable` al hacer login**
→ El contenedor de Docker no está corriendo. Ejecuta `docker-compose up` en `backend/db`.

**`relation "public.users" does not exist`**
→ Las migraciones no se aplicaron. Corre `docker-compose down -v && docker-compose up`.

**`bootstrap_db.sh: set: Illegal option -` en Docker**
→ El script tiene line endings CRLF. Ejecuta `git rm --cached -r . && git reset --hard HEAD` y vuelve a levantar Docker.

**`No module named uvicorn` o `No module named pip`**
→ El entorno virtual está corrupto (suele pasar tras actualizar Python). Recréalo:
```bash
deactivate
Remove-Item -Recurse -Force .panel   # PowerShell
python -m venv .panel
.panel\Scripts\activate
python -m ensurepip --upgrade
pip install -r requirements.txt
```

**`ModuleNotFoundError: No module named 'pydantic_core'`**
→ El entorno virtual fue creado con otra versión de Python. Borra `.panel/`, créalo de nuevo y reinstala.

**`Credenciales incorrectas` aunque la contraseña es correcta**
→ El usuario no existe. Vuelve a correr `python seed_user.py --username admin --password <pass> --role admin`.

**Frontend no conecta con el backend (error de red)**
→ Verifica que `CORS_ORIGINS` en `backend/api/.env` coincida exactamente con el puerto donde corre Vite (por defecto `http://localhost:5173`).

**Entra directo al panel sin pedir login**
→ Hay un token viejo en el navegador. Abre devtools y ejecuta `localStorage.clear()`, luego recarga.

---

## Acceso directo a la base de datos

Para inspeccionar la BD desde la terminal:

```bash
docker exec -it panel-api-postgres-1 psql -U postgres -d bd_089
```

Una vez dentro de `psql`, comandos útiles:

| Comando | Descripción |
|---|---|
| `\dt` | Listar tablas |
| `\dv` | Listar vistas |
| `\dn` | Listar esquemas |
| `\d nombre_tabla` | Ver estructura de una tabla |
| `\q` | Salir |
