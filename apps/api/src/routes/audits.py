from typing import Annotated

from fastapi import APIRouter, Depends

from src.audits import audit_comparability
from src.auth.bearer import require_bearer
from src.schemas import AuditResult, ComparabilityRequest

router = APIRouter(prefix="/v1/audits", tags=["audits"])


@router.post("/comparability", response_model=AuditResult)
def comparability(
    request: ComparabilityRequest,
    _token: Annotated[str, Depends(require_bearer)],
) -> AuditResult:
    return audit_comparability(request)

