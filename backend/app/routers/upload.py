from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.models.common import ApiResponse
from app.models.upload import SourceType, UploadSessionResponse

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("", response_model=ApiResponse[UploadSessionResponse])
async def upload_csv(
    file: UploadFile = File(...),
    source_type: SourceType = Form(...),
):
    """
    Upload a financial CSV file (Bank Statement, Razorpay Settlement, or Invoice).
    Full processing logic will be wired to the normalizer service in Phase 4/5.
    """
    # Baseline validation
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File must be a valid CSV document."
        )

    # Scaffolding placeholder response
    return ApiResponse(
        success=True,
        data=UploadSessionResponse(
            session_id="00000000-0000-0000-0000-000000000000",
            source_type=source_type,
            record_count=0,
            validation_errors=[],
            duplicate_count=0,
        )
    )
