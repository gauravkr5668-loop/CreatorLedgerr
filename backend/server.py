"""CreatorLedger — FastAPI entry point."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import logging
import os

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from db import get_db, close_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="CreatorLedger API")


@app.on_event("startup")
async def on_startup():
    db = get_db()
    # indexes
    await db.users.create_index("email", unique=True)
    await db.invoices.create_index([("user_id", 1), ("created_at", -1)])
    await db.campaigns.create_index([("user_id", 1), ("created_at", -1)])
    await db.settings.create_index("user_id", unique=True)

    # seed demo admin + sample data
    from seed_service import ensure_admin_user_seeded
    await ensure_admin_user_seeded()
    logger.info("CreatorLedger startup complete")


@app.on_event("shutdown")
async def on_shutdown():
    await close_db()


# Wire routers
from auth_routes import router as auth_router  # noqa: E402
from routes import router as app_router  # noqa: E402

app.include_router(auth_router)
app.include_router(app_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "creatorledger"}


# CORS: allow the deployed frontend + local dev. allow_credentials needs explicit origin (or wildcard with no credentials).
cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
# wildcard is okay for the demo since we also support Authorization header
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allow_origins if allow_origins != ["*"] else [],
    allow_origin_regex=".*" if allow_origins == ["*"] else None,
    allow_methods=["*"],
    allow_headers=["*"],
)
