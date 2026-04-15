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
    description: str | None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class UsuarioActual(BaseModel):
    username: str
    role: str


class UsuarioCreate(BaseModel):
    username: str
    password: str
    email: str
    role: str = "operativo"


class UsuarioResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool


CONNINFO = (
    f"host={os.getenv('DB_HOST', 'localhost')} "
    f"port={os.getenv('DB_PORT', 5432)} "
    f"dbname={os.getenv('DB_NAME')} "
    f"user={os.getenv('DB_USER')} "
    f"password={os.getenv('DB_PASSWORD')}"
)

pool: psycopg_pool.ConnectionPool = None


def _sql_normalize_text(field: str) -> str:
    return (
        "LOWER(TRANSLATE(COALESCE("
        f"{field}, ''),"
        "'ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑáàäâéèëêíìïîóòöôúùüûñ',"
        "'AAAAEEEEIIIIOOOOUUUUNaaaaeeeeiiiioooouuuun'))"
    )


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
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
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


def require_admin(usuario: UsuarioActual = Depends(get_usuario_actual)) -> UsuarioActual:
    if usuario.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol admin")
    return usuario


# ── Endpoint: POST /auth/login ───────────────────────────────────────────────
# OAuth2PasswordRequestForm lee automáticamente username y password del body
# React lo llama con: fetch("/auth/login", { method: "POST", body: formData })
@app.post("/auth/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    # 1. Buscar el usuario en la BD por username
    sql = "SELECT username, password_hash, role, is_active FROM public.users WHERE username = %(u)s"
    try:
        with pool.connection() as conn:
            cur = conn.execute(sql, {"u": form.username})
            row = cur.fetchone()
    except Exception as e:
        print(f"[login] DB error: {e}")
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


@app.post("/users", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UsuarioCreate, _: UsuarioActual = Depends(require_admin)):
    if user.role not in {"admin", "monitor", "operativo"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido")

    password_hash = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    sql = """
        INSERT INTO public.users (username, password_hash, email, role)
        VALUES (%(username)s, %(password_hash)s, %(email)s, %(role)s)
        RETURNING id, username, email, role, is_active
    """
    params = {
        "username": user.username,
        "password_hash": password_hash,
        "email": user.email,
        "role": user.role,
    }

    try:
        with pool.connection() as conn:
            cur = conn.execute(sql, params)
            row = cur.fetchone()
            conn.commit()
            cols = [desc[0] for desc in cur.description]
            return dict(zip(cols, row))
    except psycopg.errors.UniqueViolation:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El usuario o correo ya existe")
    except Exception as e:
        print(f"[create_user] DB error: {e}")
        raise HTTPException(status_code=503, detail=f"DB error: {e}")


@app.get("/health")
async def health():
    try:
        with pool.connection() as conn:
            conn.execute("SELECT 1")
            return {"status": "ok", "db": "connected"}
    except Exception as e:
        print(f"[health] DB error: {e}")
        raise HTTPException(status_code=503, detail=f"DB error: {e}")


@app.get("/extortion-types", response_model=list[TipoExtorsion])
async def get_extortion_types(_: UsuarioActual = Depends(get_usuario_actual)):
    sql = """
        SELECT id_extortion, name, description
        FROM public.extortion_type
        ORDER BY name ASC
    """
    with pool.connection() as conn:
        try:
            cur = conn.execute(sql)
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            return [dict(zip(cols, row)) for row in rows]
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"DB error: {e}")


@app.get("/data", response_model=list[IncidenteItem])
async def get_data(
    fecha: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    hora: Optional[int] = None,
    minutos: Optional[int] = None,
    tipo_extorsion: Optional[str] = None,
    id_conv: Optional[str] = None,
    _: UsuarioActual = Depends(get_usuario_actual)
):
    filters = []
    params = {}

    if fecha:
        filters.append("event_ts::date = %(fecha)s")
        params["fecha"] = fecha

    if fecha_inicio:
        filters.append("event_ts::date >= %(fecha_inicio)s")
        params["fecha_inicio"] = fecha_inicio

    if fecha_fin:
        filters.append("event_ts::date <= %(fecha_fin)s")
        params["fecha_fin"] = fecha_fin

    if hora is not None:
        filters.append("EXTRACT(HOUR FROM event_ts) = %(hora)s")
        params["hora"] = hora

    if minutos is not None:
        filters.append("EXTRACT(MINUTE FROM event_ts) = %(minutos)s")
        params["minutos"] = minutos

    if tipo_extorsion:
        normalized_tipo_extorsion = tipo_extorsion.strip()
        filters.append(
            """
            (
                id_extortion::text = %(tipo_extorsion)s
                OR {normalized_extortion_name} = {normalized_tipo_extorsion}
            )
            """.format(
                normalized_extortion_name=_sql_normalize_text("extortion_name"),
                normalized_tipo_extorsion=_sql_normalize_text("%(tipo_extorsion)s"),
            )
        )
        params["tipo_extorsion"] = normalized_tipo_extorsion

    if id_conv:
        filters.append("id_conv_eleven = %(id_conv)s")
        params["id_conv"] = id_conv

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    sql = f"""
        SELECT *
        FROM analytics.vw_report_conversation_panel
        {where}
        ORDER BY event_ts DESC
    """

    try:
        with pool.connection() as conn:
            cur = conn.execute(sql, params)
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            return [dict(zip(cols, row)) for row in rows]
    except Exception as e:
        print(f"[get_data] DB error: {e}")
        raise HTTPException(status_code=503, detail=f"DB error: {e}")


@app.get("/data/{id_conv}", response_model=IncidenteItem)
async def get_incidente(id_conv: str, _: UsuarioActual = Depends(get_usuario_actual)):
        sql = """
            SELECT * FROM analytics.vw_report_conversation_panel
            WHERE id_conv_eleven = %(id_conv)s
        """
        try:
            with pool.connection() as conn:
                cur = conn.execute(sql, {"id_conv": id_conv})
                cols = [desc[0] for desc in cur.description]
                row = cur.fetchone()
                if row is None:
                    raise HTTPException(status_code=404, detail="Incidente no encontrado")
                return dict(zip(cols, row))
        except HTTPException:
            raise
        except Exception as e:
            print(f"[get_incidente] DB error: {e}")
            raise HTTPException(status_code=503, detail=f"DB error: {e}")
