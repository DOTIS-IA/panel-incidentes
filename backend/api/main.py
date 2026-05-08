import os
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional

import bcrypt
import psycopg_pool
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from email_service import enviar_digest_coordinadores, send_email
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel

load_dotenv()

JWT_SECRET   = os.getenv("JWT_SECRET_KEY", "")
JWT_ALGO     = "HS256"
JWT_EXPIRE_H = int(os.getenv("JWT_EXPIRE_HOURS", "8"))
DEFAULT_DATA_LIMIT = int(os.getenv("DATA_DEFAULT_LIMIT", "500"))
MAX_DATA_LIMIT = int(os.getenv("DATA_MAX_LIMIT", "2000"))

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM    = os.getenv("SMTP_USER")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Panel Incidentes")
DIGEST_HOUR   = int(os.getenv("DIGEST_HOUR", "8"))


if len(JWT_SECRET) < 32:
    raise RuntimeError("JWT_SECRET_KEY must be set and contain at least 32 characters")


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


TIPOS_EXTORSION_FALLBACK = [
    {
        "id_extortion": 1,
        "name": "Extorsión presencial-exigencia de pago o bienes (Directa)",
        "description": None,
    },
    {
        "id_extortion": 2,
        "name": "Extorsión por secuestro virtual",
        "description": None,
    },
    {
        "id_extortion": 3,
        "name": "Extorsión telefónica-virtual-exigencia de pago o bienes (Indirecta)",
        "description": None,
    },
    {
        "id_extortion": 4,
        "name": "Extorsión escrita-otros medios exigencia de pago o bienes (Indirecta)",
        "description": None,
    },
    {
        "id_extortion": 5,
        "name": "Fraude-engaño telefónico-virtual",
        "description": None,
    },
    {
        "id_extortion": 6,
        "name": "Denuncia de localización y operación del probable extorsionador o grupo delictivo",
        "description": None,
    },
    {
        "id_extortion": 7,
        "name": "Extorsión por invasión-despojo de predio",
        "description": None,
    },
    {
        "id_extortion": 8,
        "name": "Extorsión por contenido sexual o íntimo",
        "description": None,
    },
]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class UsuarioActual(BaseModel):
    username: str
    role: str


class AsignacionCreate(BaseModel):
    id_conv: str
    monitoristas: list[str]


class AsignacionResponse(BaseModel):
    id: int
    id_conv: str
    assigned_to_username: str
    assigned_by_username: str
    assigned_at: datetime
    status: str
    seen_at: datetime | None = None


class AsignacionDetalle(BaseModel):
    id: int
    id_conv: str
    assigned_by_username: str
    assigned_at: datetime
    status: str
    seen_at: datetime | None = None
    folio: str | None = None
    event_ts: datetime | None = None
    extortion_name: str | None = None
    title: str | None = None
    summary: str | None = None


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


def _normalize_extortion_label(value: str | None) -> str:
    text = str(value or "").strip()
    replacements = {
        "Extorsi?n": "Extorsión",
        "Extorsion": "Extorsión",
        "telef?nica": "telefónica",
        "telefonica": "telefónica",
        "engano": "engaño",
        "localizacion": "localización",
        "operacion": "operación",
        "invasion": "invasión",
        "intimo": "íntimo",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


@asynccontextmanager
async def lifespan(_: FastAPI):
    global pool
    pool = psycopg_pool.ConnectionPool(CONNINFO, min_size=1, max_size=10)
    print("DB pool created")

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        enviar_digest_coordinadores,
        trigger="cron",
        hour=DIGEST_HOUR,
        minute=0,
        kwargs={"pool": pool},
    )
    scheduler.start()
    print(f"Scheduler started — digest diario a las {DIGEST_HOUR:02d}:00 UTC")

    yield

    scheduler.shutdown(wait=False)
    pool.close()
    print("Scheduler and DB pool closed")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)

# ── OAuth2 — le dice a FastAPI dónde está el endpoint de login ──────────────
# Cuando un endpoint usa Depends(oauth2_scheme), FastAPI extrae automáticamente
# el token del header: Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def db_unavailable(context: str, exc: Exception) -> HTTPException:
    print(f"[{context}] DB error: {exc}")
    return HTTPException(status_code=503, detail="Base de datos no disponible")


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
        if not username or not role:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
        if role == "analisis":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado para este dominio")
        return UsuarioActual(username=username, role=role)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")


def require_admin(usuario: UsuarioActual = Depends(get_usuario_actual)) -> UsuarioActual:
    if usuario.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol admin")
    return usuario


def require_coordinador_o_admin(usuario: UsuarioActual = Depends(get_usuario_actual)) -> UsuarioActual:
    if usuario.role not in {"admin", "coordinador_incidentes"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol coordinador o admin")
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
        raise db_unavailable("login", e)

    # 2. Si no existe el usuario → 401 (mismo mensaje que contraseña incorrecta,
    #    para no revelar si el username existe o no)
    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    username, password_hash, role, is_active = row

    # 3. Si la cuenta está desactivada → 403
    if not is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta desactivada")
    if role == "analisis":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado para este dominio")

    # 4. Verificar la contraseña contra el hash guardado en la BD
    #    bcrypt.checkpw nunca puede recuperar la contraseña original — solo compara
    password_ok = bcrypt.checkpw(form.password.encode(), password_hash.encode())
    if not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")

    # 5. Todo correcto → generar y devolver el JWT
    token = crear_token(username, role)
    return TokenResponse(access_token=token, token_type="bearer", role=role)


@app.post("/users", status_code=status.HTTP_410_GONE)
async def create_user(_: UsuarioActual = Depends(require_admin)):
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="La creación de usuarios se administra desde MAS_089 / mas089-auth.",
    )


@app.get("/health")
async def health():
    try:
        with pool.connection() as conn:
            conn.execute("SELECT 1")
            return {"status": "ok", "db": "connected"}
    except Exception as e:
        raise db_unavailable("health", e)


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
            tipos = [dict(zip(cols, row)) for row in rows]
            tipos = [
                {
                    **item,
                    "name": _normalize_extortion_label(item.get("name")),
                    "description": _normalize_extortion_label(item.get("description")) or None,
                }
                for item in tipos
            ]

            catalogo_invalido = len(tipos) < len(TIPOS_EXTORSION_FALLBACK) or any(
                "?" in item["name"] or not item["name"] for item in tipos
            )
            return TIPOS_EXTORSION_FALLBACK if catalogo_invalido else tipos
        except Exception as e:
            raise db_unavailable("get_extortion_types", e)


@app.get("/data", response_model=list[IncidenteItem])
async def get_data(
    fecha: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    hora: Optional[int] = Query(default=None, ge=0, le=23),
    minutos: Optional[int] = Query(default=None, ge=0, le=59),
    hora_inicio: Optional[int] = Query(default=None, ge=0, le=23),
    minutos_inicio: Optional[int] = Query(default=None, ge=0, le=59),
    hora_fin: Optional[int] = Query(default=None, ge=0, le=23),
    minutos_fin: Optional[int] = Query(default=None, ge=0, le=59),
    tipo_extorsion: Optional[str] = None,
    id_conv: Optional[str] = None,
    folio: Optional[str] = None,
    limit: int = Query(default=DEFAULT_DATA_LIMIT, ge=1, le=MAX_DATA_LIMIT),
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

    has_range_filter = any(
        value is not None
        for value in (hora_inicio, minutos_inicio, hora_fin, minutos_fin)
    )
    if has_range_filter:
        start_hour = hora_inicio if hora_inicio is not None else 0
        start_minute = minutos_inicio if minutos_inicio is not None else 0
        end_hour = hora_fin if hora_fin is not None else 23
        end_minute = minutos_fin if minutos_fin is not None else 59
        start_total = start_hour * 60 + start_minute
        end_total = end_hour * 60 + end_minute
        if end_total < start_total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La hora final debe ser igual o posterior a la hora inicial",
            )
        filters.append(
            "((EXTRACT(HOUR FROM event_ts)::int * 60) + EXTRACT(MINUTE FROM event_ts)::int) "
            "BETWEEN %(minuto_inicio_total)s AND %(minuto_fin_total)s"
        )
        params["minuto_inicio_total"] = start_total
        params["minuto_fin_total"] = end_total

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

    if folio:
        filters.append("folio = %(folio)s")
        params["folio"] = folio

    where = f"WHERE {' AND '.join(filters)}" if filters else ""
    sql = f"""
        SELECT *
        FROM analytics.vw_report_conversation_panel
        {where}
        ORDER BY event_ts DESC
        LIMIT %(limit)s
    """
    params["limit"] = limit

    try:
        with pool.connection() as conn:
            cur = conn.execute(sql, params)
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            return [dict(zip(cols, row)) for row in rows]
    except Exception as e:
        raise db_unavailable("get_data", e)


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
            raise db_unavailable("get_incidente", e)


# ── Assignments ──────────────────────────────────────────────────────────────

@app.post("/assignments", response_model=list[AsignacionResponse], status_code=status.HTTP_201_CREATED)
async def create_assignments(
    body: AsignacionCreate,
    usuario: UsuarioActual = Depends(require_coordinador_o_admin),
):
    if not body.monitoristas:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La lista de monitoristas no puede estar vacía")

    try:
        with pool.connection() as conn:
            # Validar que el id_conv exista en la vista
            existe = conn.execute(
                "SELECT 1 FROM analytics.vw_report_conversation_panel WHERE id_conv_eleven = %(c)s LIMIT 1",
                {"c": body.id_conv},
            ).fetchone()
            if existe is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"El caso {body.id_conv} no existe")

            # Obtener el id del usuario que asigna
            row = conn.execute(
                "SELECT id FROM public.users WHERE username = %(u)s",
                {"u": usuario.username},
            ).fetchone()
            if row is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario asignador no encontrado")
            assigned_by_id = row[0]

            # Resolver usernames de monitoristas a filas completas
            cur = conn.execute(
                "SELECT id, username, email, role FROM public.users WHERE username = ANY(%(names)s) AND is_active = true",
                {"names": body.monitoristas},
            )
            cols = [d[0] for d in cur.description]
            monitoristas_rows = [dict(zip(cols, r)) for r in cur.fetchall()]

            invalidos = set(body.monitoristas) - {m["username"] for m in monitoristas_rows}
            if invalidos:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Usuarios no encontrados o inactivos: {', '.join(invalidos)}",
                )

            no_monitoristas = [m["username"] for m in monitoristas_rows if m["role"] != "monitorista_incidentes"]
            if no_monitoristas:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Los siguientes usuarios no tienen rol monitorista_incidentes: {', '.join(no_monitoristas)}",
                )

            # Insertar solo los que no estén ya asignados y pendientes
            creadas = []
            for m in monitoristas_rows:
                existente = conn.execute(
                    "SELECT id FROM public.case_assignments WHERE id_conv = %(c)s AND assigned_to = %(t)s AND status = 'asignado'",
                    {"c": body.id_conv, "t": m["id"]},
                ).fetchone()
                if existente:
                    continue

                cur = conn.execute(
                    """
                    INSERT INTO public.case_assignments (id_conv, assigned_to, assigned_by)
                    VALUES (%(id_conv)s, %(to)s, %(by)s)
                    RETURNING id, id_conv, assigned_to, assigned_by, assigned_at, status, seen_at
                    """,
                    {"id_conv": body.id_conv, "to": m["id"], "by": assigned_by_id},
                )
                r = dict(zip([d[0] for d in cur.description], cur.fetchone()))
                creadas.append({**r, "assigned_to_username": m["username"], "assigned_by_username": usuario.username})

            conn.commit()

        # Enviar correo a cada monitorista nuevo (fuera del bloque de BD)
        for m in monitoristas_rows:
            if any(c["assigned_to_username"] == m["username"] for c in creadas):
                send_email(
                    to=m["email"],
                    subject="Nuevo caso asignado — Panel de Incidentes",
                    body=(
                        f"Hola {m['username']},\n\n"
                        f"Se te ha asignado el caso {body.id_conv} en el Panel de Incidentes.\n\n"
                        f"Ingresa al panel para ver los detalles.\n"
                    ),
                )

        return creadas

    except HTTPException:
        raise
    except Exception as e:
        raise db_unavailable("create_assignments", e)


@app.get("/assignments/me", response_model=list[AsignacionDetalle])
async def get_my_assignments(
    status_filter: Optional[str] = Query(default=None, alias="status", pattern="^(asignado|visto)$"),
    usuario: UsuarioActual = Depends(get_usuario_actual),
):
    if usuario.role != "monitorista_incidentes":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol monitorista_incidentes")

    try:
        with pool.connection() as conn:
            row = conn.execute(
                "SELECT id FROM public.users WHERE username = %(u)s",
                {"u": usuario.username},
            ).fetchone()
            if row is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
            user_id = row[0]

            status_clause = "AND ca.status = %(status_filter)s" if status_filter else ""
            sql = f"""
                SELECT
                    ca.id,
                    ca.id_conv,
                    u_by.username  AS assigned_by_username,
                    ca.assigned_at,
                    ca.status,
                    ca.seen_at,
                    v.folio,
                    v.event_ts,
                    v.extortion_name,
                    v.title,
                    v.summary
                FROM public.case_assignments ca
                JOIN public.users u_by ON ca.assigned_by = u_by.id
                LEFT JOIN analytics.vw_report_conversation_panel v ON ca.id_conv = v.id_conv_eleven
                WHERE ca.assigned_to = %(user_id)s
                {status_clause}
                ORDER BY ca.assigned_at DESC
            """
            params: dict = {"user_id": user_id}
            if status_filter:
                params["status_filter"] = status_filter

            cur = conn.execute(sql, params)
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, r)) for r in cur.fetchall()]

    except HTTPException:
        raise
    except Exception as e:
        raise db_unavailable("get_my_assignments", e)


@app.patch("/assignments/{assignment_id}/visto", response_model=AsignacionResponse)
async def marcar_visto(
    assignment_id: int,
    usuario: UsuarioActual = Depends(get_usuario_actual),
):
    if usuario.role != "monitorista_incidentes":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol monitorista_incidentes")

    try:
        with pool.connection() as conn:
            row = conn.execute(
                "SELECT id FROM public.users WHERE username = %(u)s",
                {"u": usuario.username},
            ).fetchone()
            if row is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
            user_id = row[0]

            cur = conn.execute(
                """
                UPDATE public.case_assignments
                SET status = 'visto', seen_at = NOW()
                WHERE id = %(id)s AND assigned_to = %(user_id)s
                RETURNING id, id_conv, assigned_to, assigned_by, assigned_at, status, seen_at
                """,
                {"id": assignment_id, "user_id": user_id},
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asignación no encontrada")

            cols = [d[0] for d in cur.description]
            result = dict(zip(cols, row))
            conn.commit()

            # Resolver usernames para la respuesta
            usernames = conn.execute(
                "SELECT u1.username, u2.username FROM public.users u1, public.users u2 WHERE u1.id = %(to)s AND u2.id = %(by)s",
                {"to": result["assigned_to"], "by": result["assigned_by"]},
            ).fetchone()

            return {
                **result,
                "assigned_to_username": usernames[0] if usernames else "",
                "assigned_by_username": usernames[1] if usernames else "",
            }

    except HTTPException:
        raise
    except Exception as e:
        raise db_unavailable("marcar_visto", e)
