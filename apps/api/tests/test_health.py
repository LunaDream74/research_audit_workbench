from fastapi.testclient import TestClient

from app import app


def test_health() -> None:
    response = TestClient(app).get("/health")
    assert response.status_code == 200
    assert response.json() == {"service": "analysis-api", "status": "ok"}


def test_cors_allows_only_the_configured_local_origin() -> None:
    client = TestClient(app)
    allowed = client.options(
        "/v1/audits/comparability",
        headers={
            "Origin": "http://127.0.0.1:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    denied = client.options(
        "/v1/audits/comparability",
        headers={
            "Origin": "https://untrusted.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert allowed.headers["access-control-allow-origin"] == "http://127.0.0.1:3000"
    assert "access-control-allow-origin" not in denied.headers
