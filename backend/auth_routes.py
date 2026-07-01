"""Authentication endpoints."""
import os
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from datetime import datetime, timezone

from db import get_db
from auth import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    set_auth_cookies, clear_auth_cookies, get_current_user, get_jwt_secret,
    JWT_ALGORITHM, ACCESS_TOKEN_MINUTES, COOKIE_SECURE,
)
from models import UserRegister, UserLogin, UserPublic, new_id
import jwt

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _public(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "member"),
        "agency_name": user.get("agency_name", "CreatorLedger Studio"),
    }


@router.post("/register")
async def register(body: UserRegister, response: Response):
    db = get_db()
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = {
        "id": new_id(),
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name or email.split("@")[0].title(),
        "role": "owner",
        "agency_name": "CreatorLedger Studio",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)

    # seed sample data for this new user
    from seed_service import seed_user_data
    await seed_user_data(user["id"])

    access = create_access_token(user["id"], user["email"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return _public(user)


@router.post("/login")
async def login(body: UserLogin, response: Response):
    db = get_db()
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    access = create_access_token(user["id"], user["email"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)

    # Ensure demo user has seeded data
    has_data = await db.campaigns.count_documents({"user_id": user["id"]})
    if not has_data:
        from seed_service import seed_user_data
        await seed_user_data(user["id"])

    return _public(user)


@router.post("/google")
async def google_demo(response: Response):
    """Demo Google sign-in — logs the user into the shared demo account
    (real Google OAuth can be wired later). Lets reviewers click 'Continue with Google'
    and instantly land in a populated dashboard.

    SECURITY: this performs no actual verification — it is an open login to a shared
    account. It only runs when DEMO_MODE=true. Before onboarding real customers, either
    remove this route or replace it with real Google OAuth (verify the id_token server-side).
    """
    if os.environ.get("DEMO_MODE", "false").lower() != "true":
        raise HTTPException(status_code=404, detail="Not found")
    db = get_db()
    demo_email = os.environ.get("ADMIN_EMAIL", "demo@creatorledger.com")
    user = await db.users.find_one({"email": demo_email})
    if not user:
        raise HTTPException(status_code=500, detail="Demo account not initialised.")
    access = create_access_token(user["id"], user["email"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return _public(user)


@router.post("/logout")
async def logout(response: Response, _user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return _public(user)


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    db = get_db()
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(user["id"], user["email"])
    response.set_cookie(
        key="access_token", value=access, httponly=True, secure=COOKIE_SECURE,
        samesite="lax", max_age=ACCESS_TOKEN_MINUTES * 60, path="/",
    )
    return {"ok": True}
