import os
from contextlib import asynccontextmanager
from typing import Optional

import psycopg
import psycopg_pool
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

load_dotenv()

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


@app.get("/health")
def health():
    with pool.connection() as conn:
        try:
            conn.execute("SELECT 1")
            return {"status": "ok", "db": "connected"}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"DB error: {e}")
        
@app.get("/data")
def get_data(
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
