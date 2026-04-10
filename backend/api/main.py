import os
from contextlib import asynccontextmanager
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

import psycopg
import psycopg_pool
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()


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
    allow_methods=["GET"],                    # este panel solo lee datos
    allow_headers=["*"],
)


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
