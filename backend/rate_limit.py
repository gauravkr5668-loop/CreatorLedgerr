"""Shared rate limiter instance.

Kept separate so auth_routes.py and routes.py can import it without a circular
import back through server.py. Uses in-memory storage — fine for local dev /
single-worker prod. If you ever run multiple uvicorn workers, switch to Redis:
Limiter(key_func=get_remote_address, storage_uri="redis://...").
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
