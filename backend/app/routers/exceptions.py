from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Query
from app.models.common import ApiResponse, PaginationMeta
from app.models.reconciliation import ReconciliationResultsListResponse, MatchStatus

router = APIRouter(prefix="/exceptions", tags=["Exceptions"])


@router.get("", response_model=ApiResponse[ReconciliationResultsListResponse])
async def get_exception_queue(
    session_id: Optional[UUID] = Query(None, description="Optional session filter"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get exception items (confidence < 60 or validation failures or review rejected) for human resolution.
    """
    return ApiResponse(
        success=True,
        data=ReconciliationResultsListResponse(
            results=[],
            pagination=PaginationMeta(
                page=page,
                limit=limit,
                total=0,
                total_pages=0,
            )
        )
    )
