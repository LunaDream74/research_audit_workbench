import asyncio

import httpx
import pytest
from fastapi import HTTPException

from src.auth import bearer


class FakeClient:
    def __init__(self, status_code: int = 200, error: httpx.HTTPError | None = None, **_: object):
        self.status_code = status_code
        self.error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_: object):
        return None

    async def get(self, url: str, headers: dict[str, str]):
        assert url == "https://project.supabase.co/auth/v1/user"
        assert headers == {"apikey": "publishable", "Authorization": "Bearer access-token"}
        if self.error:
            raise self.error
        return httpx.Response(self.status_code)


def configure(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUPABASE_URL", "https://project.supabase.co/")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "publishable")


def test_rejects_a_non_bearer_value() -> None:
    with pytest.raises(HTTPException) as raised:
        asyncio.run(bearer.require_bearer("Basic credentials"))
    assert raised.value.status_code == 401


def test_accepts_a_token_verified_by_supabase(monkeypatch: pytest.MonkeyPatch) -> None:
    configure(monkeypatch)
    monkeypatch.setattr(bearer.httpx, "AsyncClient", FakeClient)
    assert asyncio.run(bearer.require_bearer("Bearer access-token")) == "access-token"


def test_rejects_a_token_supabase_does_not_recognize(monkeypatch: pytest.MonkeyPatch) -> None:
    configure(monkeypatch)
    monkeypatch.setattr(bearer.httpx, "AsyncClient", lambda **kwargs: FakeClient(401, **kwargs))
    with pytest.raises(HTTPException) as raised:
        asyncio.run(bearer.require_bearer("Bearer access-token"))
    assert raised.value.status_code == 401


def test_fails_closed_when_supabase_is_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    configure(monkeypatch)
    error = httpx.ConnectError("offline")
    monkeypatch.setattr(bearer.httpx, "AsyncClient", lambda **kwargs: FakeClient(error=error, **kwargs))
    with pytest.raises(HTTPException) as raised:
        asyncio.run(bearer.require_bearer("Bearer access-token"))
    assert raised.value.status_code == 503
