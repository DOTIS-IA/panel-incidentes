import os
from contextlib import asynccontextmanager

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
