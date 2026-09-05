import math
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Query
from app.models.common import ApiResponse, PaginationMeta
from app.models.reconciliation import ReconciliationResultsListResponse, MatchStatus
from app import store

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
    if session_id:
        items = store.reconciliation_results.get(str(session_id), [])
    else:
        items = [item for results in store.reconciliation_results.values() for item in results]

    exceptions = [r for r in items if r.status == MatchStatus.EXCEPTION]

    total = len(exceptions)
    total_pages = max(1, math.ceil(total / limit)) if total > 0 else 0
    start = (page - 1) * limit
    end = start + limit
    paginated_items = exceptions[start:end]

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
