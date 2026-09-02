from fastapi import FastAPI

from src.routes.audits import router as audits_router
from src.routes.imports import router as imports_router

app = FastAPI(title="WebMCP Research Audit API", version="0.1.0")
app.include_router(audits_router)
app.include_router(imports_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "analysis-api", "status": "ok"}
