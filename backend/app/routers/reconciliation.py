import math
import uuid
from datetime import datetime
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
from app.services.reconciler import run_reconciliation
from app import store

router = APIRouter(prefix="/reconcile", tags=["Reconciliation"])


from app.routers.auth import get_current_user_optional, UserDB
from fastapi import Depends

@router.post("", response_model=ApiResponse[ReconciliationSummaryResponse])
async def trigger_reconciliation(
    request: ReconciliationRequest,
    current_user: Optional[UserDB] = Depends(get_current_user_optional),
):
    """
    Trigger three-source deterministic reconciliation using normalized data from the store.
    """
    session_id = str(uuid.uuid4())
    user_id = current_user.id if current_user else None
    company_name = request.company_name or (current_user.company_name if current_user else "Apex Technologies Pvt Ltd")

    summary = run_reconciliation(
        recon_session_id=session_id,
        bank_upload_id=str(request.bank_upload_id),
        razorpay_upload_id=str(request.razorpay_upload_id),
        invoice_upload_id=str(request.invoice_upload_id),
        company_name=company_name,
        user_id=user_id,
    )
    return ApiResponse(
        success=True,
        data=summary,
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
    sid_str = str(session_id)
    if sid_str not in store.reconciliation_results:
        store.restore_session_to_memory(sid_str)

    all_results = store.reconciliation_results.get(sid_str, [])
    
    if status is not None:
        filtered = [r for r in all_results if r.status == status]
    else:
        filtered = all_results

    total = len(filtered)
    total_pages = max(1, math.ceil(total / limit)) if total > 0 else 0
    start = (page - 1) * limit
    end = start + limit
    paginated_items = filtered[start:end]

    return ApiResponse(
        success=True,
        data=ReconciliationResultsListResponse(
            results=paginated_items,
            pagination=PaginationMeta(
                page=page,
                limit=limit,
                total=total,
                total_pages=total_pages,
            )
        )
    )


@router.get("/{session_id}/results/{result_id}", response_model=ApiResponse[ReconciliationResultItem])
async def get_transaction_detail(session_id: UUID, result_id: UUID):
    """
    Get side-by-side transaction detail including AI explanation.
    """
    item = store.find_result(result_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")
    return ApiResponse(
        success=True,
        data=item,
    )


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
    now = datetime.utcnow()
    
    updated = store.update_result(
        result_id,
        status=new_status,
        review_action=body.action,
        reviewed_at=now,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")

    return ApiResponse(
        success=True,
        data=ReviewResponse(
            result_id=result_id,
            status=new_status,
            review_action=body.action,
            reviewed_at=now,
        )
    )
