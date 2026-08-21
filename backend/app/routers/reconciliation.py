from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException, status
from app.models.common import ApiResponse, PaginationMeta
from app.models.reconciliation import (
    MatchStatus,
    ReconciliationRequest,
    ReconciliationSummaryResponse,
    ReconciliationResultsListResponse,
    ReconciliationResultItem,
    ReviewRequest,
    ReviewResponse,
    ReviewActionType,
)
from datetime import datetime

router = APIRouter(prefix="/reconcile", tags=["Reconciliation"])


@router.post("", response_model=ApiResponse[ReconciliationSummaryResponse])
async def trigger_reconciliation(request: ReconciliationRequest):
    """
    Trigger three-source deterministic reconciliation.
    Wired to the reconciler service in Phase 6.
    """
    return ApiResponse(
        success=True,
        data=ReconciliationSummaryResponse(
            session_id=UUID("00000000-0000-0000-0000-000000000000"),
            total_records=0,
            matched=0,
            review_required=0,
            exceptions=0,
            processing_time_ms=0,
        )
    )


@router.get("/{session_id}/results", response_model=ApiResponse[ReconciliationResultsListResponse])
async def get_reconciliation_results(
    session_id: UUID,
    status: Optional[MatchStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Get paginated and filtered reconciliation results for a session.
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


@router.get("/{session_id}/results/{result_id}", response_model=ApiResponse[ReconciliationResultItem])
async def get_transaction_detail(session_id: UUID, result_id: UUID):
    """
    Get side-by-side transaction detail including AI explanation.
    """
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")


@router.post("/{session_id}/results/{result_id}/review", response_model=ApiResponse[ReviewResponse])
async def review_reconciliation_item(
    session_id: UUID,
    result_id: UUID,
    body: ReviewRequest,
):
    """
    Human review action (APPROVED or REJECTED).
    LOCKED Rule: Confidence score remains unchanged.
    APPROVED -> MATCHED
    REJECTED -> EXCEPTION
    """
    new_status = MatchStatus.MATCHED if body.action == ReviewActionType.APPROVED else MatchStatus.EXCEPTION
    return ApiResponse(
        success=True,
        data=ReviewResponse(
            result_id=result_id,
            status=new_status,
            review_action=body.action,
            reviewed_at=datetime.utcnow(),
        )
    )
