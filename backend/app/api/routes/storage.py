from __future__ import annotations
import mimetypes
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import FileResponse, RedirectResponse
from app.core.security import decode_storage_token
from app.core.storage import StorageService
router = APIRouter(prefix="/storage", tags=["storage"])
@router.get("/download", response_model=None)
async def download_storage_object(token: str = Query(...)) -> Response:
    payload = decode_storage_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid download token")
    key = str(payload["key"])
    storage = StorageService()
    if storage.uses_local_storage:
        try:
            file_path = storage.resolve_local_path(key)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        if not file_path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        media_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        return FileResponse(file_path, media_type=media_type, filename=Path(key).name)
    return RedirectResponse(url=storage.generate_presigned_url(key, expires_in=300))
