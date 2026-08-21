from decimal import Decimal
from fastapi import APIRouter
from app.models.common import ApiResponse
from app.models.reconciliation import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=ApiResponse[DashboardSummaryResponse])
async def get_dashboard_summary():
    """
    Get aggregated dashboard summary statistics.
    """
    return ApiResponse(
        success=True,
        data=DashboardSummaryResponse(
            total_transactions=0,
            matched=0,
            review_required=0,
            exceptions=0,
            match_rate=0.0,
            total_amount_reconciled=Decimal("0.00"),
            pending_amount=Decimal("0.00"),
            recent_sessions=[],
        )
    )
