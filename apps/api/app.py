from fastapi import FastAPI

from src.routes.audits import router as audits_router

app = FastAPI(title="WebMCP Research Audit API", version="0.1.0")
app.include_router(audits_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"service": "analysis-api", "status": "ok"}
