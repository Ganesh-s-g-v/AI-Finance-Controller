import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.models.common import ApiResponse
from app.models.upload import SourceType, UploadSessionResponse
from app.services.normalizer import normalize_bank, normalize_razorpay, normalize_invoice
from app import store

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("", response_model=ApiResponse[UploadSessionResponse])
async def upload_csv(
    file: UploadFile = File(...),
    source_type: SourceType = Form(...),
):
    """
    Upload a financial CSV file (Bank Statement, Razorpay Settlement, or Invoice).
    Parses and normalizes records into in-memory store.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File must be a valid CSV document."
        )

    content = await file.read()
    session_id = str(uuid.uuid4())

    if source_type == SourceType.BANK:
        record_count, duplicate_count, errors = normalize_bank(session_id, content)
    elif source_type == SourceType.RAZORPAY:
        record_count, duplicate_count, errors = normalize_razorpay(session_id, content)
    elif source_type == SourceType.INVOICE:
        record_count, duplicate_count, errors = normalize_invoice(session_id, content)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported source type: {source_type}"
        )

    # Persist session metadata in store
    store.upload_sessions[session_id] = {
        "session_id": session_id,
        "source_type": source_type,
        "record_count": record_count,
        "validation_errors": errors,
        "duplicate_count": duplicate_count,
        "created_at": datetime.utcnow().isoformat(),
    }

    return ApiResponse(
        success=True,
        data=UploadSessionResponse(
            session_id=session_id,
            source_type=source_type,
            record_count=record_count,
            validation_errors=errors,
            duplicate_count=duplicate_count,
        )
    )
