"""CreatorLedger — FastAPI entry point."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import logging
import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from db import get_db, close_db
from rate_limit import limiter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="CreatorLedger API")

# Rate limiting — protects /api/auth/login from brute-force credential guessing and
# /api/invoices/upload from being hammered to run up LLM extraction costs.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


# Catch-all for anything not already handled (e.g. by FastAPI's own HTTPException
# handler, or the RateLimitExceeded handler above). Without this, an unexpected
# error (bad DB query, bug, etc.) can surface its full Python traceback to the
# client. This logs the traceback server-side and always returns a generic 500.
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


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


# CORS: we use httpOnly cookies (allow_credentials=True), so origins MUST be an explicit
# allowlist. A wildcard regex + credentials lets ANY website read authenticated responses
# on behalf of a logged-in user — never combine those two, even for a demo.
cors_origins_env = os.environ.get("CORS_ORIGINS", "")
allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
if not allow_origins:
    logger.warning(
        "CORS_ORIGINS is not set — no cross-origin requests will be allowed. "
        "Set CORS_ORIGINS to a comma-separated list of exact frontend origins "
        "(e.g. https://app.creatorledger.com), never '*'."
    )
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
