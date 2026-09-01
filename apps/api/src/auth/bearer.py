from typing import Annotated

from fastapi import Header, HTTPException, status


def require_bearer(authorization: Annotated[str | None, Header()] = None) -> str:
    """Require a token now; full Supabase signature verification is checklist item 8."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    return token

