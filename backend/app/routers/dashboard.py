from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends
from app.models.common import ApiResponse
from app.models.reconciliation import DashboardSummaryResponse, MatchStatus
from app.routers.auth import get_current_user_optional, UserDB
from app import store

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=ApiResponse[DashboardSummaryResponse])
async def get_dashboard_summary(
    current_user: Optional[UserDB] = Depends(get_current_user_optional)
):
    """
    Get aggregated dashboard summary statistics across active reconciliation sessions.
    """
    user_id = current_user.id if current_user else None
    
    # Filter sessions by user if not a sample demo account
    is_demo = current_user and current_user.email in [
        "cfo@financecontroller.ai",
        "auditor@financecontroller.ai",
        "admin@financecontroller.ai",
        "sarah@apex.io",
    ]

    target_sessions = []
    for sid, sdata in store.reconciliation_sessions.items():
        if is_demo or not user_id or sdata.get("user_id") == user_id:
            target_sessions.append(sid)

    all_items = []
    for sid in target_sessions:
        if sid in store.reconciliation_results:
            all_items.extend(store.reconciliation_results[sid])

    total_transactions = len(all_items)
    matched = sum(1 for i in all_items if i.status == MatchStatus.MATCHED)
    review_required = sum(1 for i in all_items if i.status == MatchStatus.REVIEW_REQUIRED)
    exceptions = sum(1 for i in all_items if i.status == MatchStatus.EXCEPTION)

    match_rate = round((matched / total_transactions * 100), 1) if total_transactions > 0 else (100.0 if total_transactions == 0 else 0.0)

    total_amount_reconciled = Decimal("0.00")
    pending_amount = Decimal("0.00")

    for i in all_items:
        amount = Decimal("0.00")
        if i.settlement:
            amount = i.settlement.net_amount
        elif i.invoice:
            amount = i.invoice.total_amount
        elif i.bank_transaction:
            amount = i.bank_transaction.amount

        if i.status == MatchStatus.MATCHED:
            total_amount_reconciled += amount
        else:
            pending_amount += amount

    recent_sessions = [
        s for sid, s in store.reconciliation_sessions.items()
        if is_demo or not user_id or s.get("user_id") == user_id
    ][::-1][:5]

    return ApiResponse(
        success=True,
        data=DashboardSummaryResponse(
            total_transactions=total_transactions,
            matched=matched,
            review_required=review_required,
            exceptions=exceptions,
            match_rate=match_rate,
            total_amount_reconciled=total_amount_reconciled,
            pending_amount=pending_amount,
            recent_sessions=recent_sessions,
        )
    )
