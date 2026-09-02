import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes.audits import router as audits_router
from src.routes.imports import router as imports_router

app = FastAPI(title="WebMCP Research Audit API", version="0.1.0")
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://127.0.0.1:3000,http://localhost:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.include_router(audits_router)
app.include_router(imports_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "analysis-api", "status": "ok"}
