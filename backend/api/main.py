import os
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional

import bcrypt
import psycopg
import psycopg_pool
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel

load_dotenv()

JWT_SECRET   = os.getenv("JWT_SECRET_KEY", "")
JWT_ALGO     = "HS256"
JWT_EXPIRE_H = int(os.getenv("JWT_EXPIRE_HOURS", "8"))


class IncidenteItem(BaseModel):
    # Identificadores
    id_conv_eleven: str
    id_agent: str
    agent_name: str | None
    id_extortion: int | None
    extortion_name: str | None

    # Tiempos
    event_ts: datetime
    start_time: datetime | None
    end_time: datetime | None
    duration_secs: int | None

    # Transcripción y resumen
    transcription: Any | None   # jsonb — estructura variable
    title: str | None
    summary: str | None

    # Datos del reporte
    folio: str | None
    report_date: date | None
    mode: str | None
    time_rep: str | None
    place: str | None
    phone: str | None
    caller_role: str | None
    contact_via: str | None
    demand_type: str | None
    required_amount: list[Decimal] | None
    deposited_amount: list[Decimal] | None
    acc_numbers: list[str] | None
    acc_holders: list[str] | None
    is_actionable: bool | None


class TipoExtorsion(BaseModel):
    id_extortion: int
    name: str
    description: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class UsuarioActual(BaseModel):
    username: str
    role: str


CONNINFO = (
    f"host={os.getenv('DB_HOST', 'localhost')} "
    f"port={os.getenv('DB_PORT', 5432)} "
    f"dbname={os.getenv('DB_NAME')} "
    f"user={os.getenv('DB_USER')} "
    f"password={os.getenv('DB_PASSWORD')}"
)

pool: psycopg_pool.ConnectionPool = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global pool
    pool = psycopg_pool.ConnectionPool(CONNINFO, min_size=1, max_size=10)
    print("DB pool created")
    yield
    pool.close()
    print("DB pool closed")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # origen del frontend React (Vite), cambiar en produccion por dominio
    allow_methods=["GET", "POST"],            # POST necesario para el login
    allow_headers=["*"],
)

# ── OAuth2 — le dice a FastAPI dónde está el endpoint de login ──────────────
# Cuando un endpoint usa Depends(oauth2_scheme), FastAPI extrae automáticamente
# el token del header: Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Función: crear JWT ───────────────────────────────────────────────────────
def crear_token(username: str, role: str) -> str:
    payload = {
        "sub": username,                                        # subject — quién es
        "role": role,                                           # rol del usuario
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_H)  # cuándo expira
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


# ── Función: verificar JWT en cada request protegido ────────────────────────
def get_usuario_actual(token: str = Depends(oauth2_scheme)) -> UsuarioActual:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if not username:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        return UsuarioActual(username=username, role=role)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")


# ── Endpoint: POST /auth/login ───────────────────────────────────────────────
# OAuth2PasswordRequestForm lee automáticamente username y password del body
# React lo llama con: fetch("/auth/login", { method: "POST", body: formData })
@app.post("/auth/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    # 1. Buscar el usuario en la BD por username
    sql = "SELECT username, password_hash, role, is_active FROM public.users WHERE username = %(u)s"
    with pool.connection() as conn:
        try:
            cur = conn.execute(sql, {"u": form.username})
            row = cur.fetchone()
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"DB error: {e}")

    # 2. Si no existe el usuario → 401 (mismo mensaje que contraseña incorrecta,
    #    para no revelar si el username existe o no)
    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    username, password_hash, role, is_active = row

    # 3. Si la cuenta está desactivada → 403
    if not is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada")

    # 4. Verificar la contraseña contra el hash guardado en la BD
    #    bcrypt.checkpw nunca puede recuperar la contraseña original — solo compara
    password_ok = bcrypt.checkpw(form.password.encode(), password_hash.encode())
    if not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    # 5. Todo correcto → generar y devolver el JWT
    token = crear_token(username, role)
    return TokenResponse(access_token=token, token_type="bearer", role=role)


@app.get("/health")
async def health():
    with pool.connection() as conn:
        try:
            conn.execute("SELECT 1")
            return {"status": "ok", "db": "connected"}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"DB error: {e}")

@app.get("/data", response_model=list[IncidenteItem])
async def get_data(
    fecha: Optional[str] = None,
    tipo_extorsion: Optional[int] = None,
    id_conv: Optional[str] = None,
):
    filters = []
    params = {}

    if fecha:
        filters.append("event_ts::date = %(fecha)s")
        params["fecha"] = fecha

    if tipo_extorsion:
        filters.append("id_extortion = %(tipo_extorsion)s")
        params["tipo_extorsion"] = tipo_extorsion

    if id_conv:
        filters.append("id_conv_eleven = %(id_conv)s")
        params["id_conv"] = id_conv

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    sql = f"SELECT * FROM analytics.vw_report_conversation_panel {where}"

    with pool.connection() as conn:
        try:
            cur = conn.execute(sql, params)
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            return [dict(zip(cols, row)) for row in rows]
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"DB error: {e}")


@app.get("/data/{id_conv}", response_model=IncidenteItem)
async def get_incidente(id_conv: str):
    sql = """
        SELECT * FROM analytics.vw_report_conversation_panel
        WHERE id_conv_eleven = %(id_conv)s
    """
    with pool.connection() as conn:
        try:
            cur = conn.execute(sql, {"id_conv": id_conv})
            cols = [desc[0] for desc in cur.description]
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Incidente no encontrado")
            return dict(zip(cols, row))
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"DB error: {e}")


@app.get("/extortion-types", response_model=list[TipoExtorsion])
async def get_extortion_types():
    sql = "SELECT id_extortion, name, description FROM public.extortion_type ORDER BY id_extortion"
    with pool.connection() as conn:
        try:
            cur = conn.execute(sql)
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            return [dict(zip(cols, row)) for row in rows]
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"DB error: {e}")
