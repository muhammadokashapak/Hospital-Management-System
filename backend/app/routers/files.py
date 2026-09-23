from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
from typing import List, Optional
from .. import models, database, dependencies, audit
from ..tenant_middleware import TenantContext

router = APIRouter(
    prefix="/files",
    tags=["Files & Documents"]
)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".dcm", ".txt", ".csv", ".docx"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 # 15MB

@router.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    resource_type: Optional[str] = Form("General"),
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' is not allowed."
        )

    # Read content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum limit of 15MB"
        )

    # Create tenant-specific storage directory
    tenant_dir = os.path.join(UPLOAD_DIR, f"tenant_{ctx.hospital_id}")
    os.makedirs(tenant_dir, exist_ok=True)

    # Server-generated unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    storage_path = os.path.join(tenant_dir, unique_filename)

    with open(storage_path, "wb") as f:
        f.write(content)

    uploaded = models.UploadedFile(
        hospital_id=ctx.hospital_id,
        uploader_user_id=ctx.user_id,
        original_name=file.filename,
        storage_path=storage_path,
        mime_type=file.content_type,
        file_size_bytes=len(content),
        resource_type=resource_type
    )
    db.add(uploaded)
    db.commit()
    db.refresh(uploaded)

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="FILE_UPLOADED",
        module="FILES",
        details=f"Uploaded file '{file.filename}' (ID {uploaded.id})",
        request=request
    )

    return {
        "file_id": uploaded.id,
        "filename": uploaded.original_name,
        "size_bytes": uploaded.file_size_bytes,
        "download_url": f"/files/download/{uploaded.id}"
    }

@router.get("/download/{file_id}")
def download_file(
    file_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    # Strict tenant verification: query by file_id AND hospital_id
    uploaded = db.query(models.UploadedFile).filter(
        models.UploadedFile.id == file_id,
        models.UploadedFile.hospital_id == ctx.hospital_id
    ).first()

    if not uploaded:
        audit.log_audit_event(
            db=db,
            hospital_id=ctx.hospital_id,
            user_id=ctx.user_id,
            action="UNAUTHORIZED_FILE_ACCESS_ATTEMPT",
            module="FILES",
            details=f"Attempted to access non-tenant file_id {file_id}",
            request=request
        )
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.exists(uploaded.storage_path):
        raise HTTPException(status_code=404, detail="File content missing on server")

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="FILE_DOWNLOADED",
        module="FILES",
        details=f"Downloaded file '{uploaded.original_name}' (ID {uploaded.id})",
        request=request
    )

    return FileResponse(
        path=uploaded.storage_path,
        filename=uploaded.original_name,
        media_type=uploaded.mime_type or "application/octet-stream"
    )
