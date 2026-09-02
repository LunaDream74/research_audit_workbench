from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from src.auth.bearer import require_bearer
from src.importers import ImportPackageError, preview_prepared_package
from src.schemas import ImportPreview

router = APIRouter(prefix="/v1/imports", tags=["imports"])


@router.post("/preview", response_model=ImportPreview)
async def preview_import(
    package: Annotated[UploadFile, File()],
    schema_version: Annotated[str, Form()] = "1.0",
    _token: Annotated[str, Depends(require_bearer)] = "",
) -> ImportPreview:
    if package.content_type not in {"application/zip", "application/x-zip-compressed", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="A ZIP package is required")
    package_bytes = await package.read(MAX_UPLOAD_READ)
    if len(package_bytes) >= MAX_UPLOAD_READ:
        raise HTTPException(status_code=413, detail="Package exceeds the 10 MB compressed limit")
    try:
        return preview_prepared_package(package_bytes, schema_version)
    except ImportPackageError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail) from error


MAX_UPLOAD_READ = 10 * 1024 * 1024 + 1
