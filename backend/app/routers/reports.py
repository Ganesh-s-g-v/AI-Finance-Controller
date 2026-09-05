import csv
import io
from uuid import UUID
from fastapi import APIRouter, Query, Response, HTTPException, status
from app.models.reconciliation import MatchStatus
from app import store

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{session_id}/export")
async def export_reconciliation_report(
    session_id: UUID,
    fmt: str = Query("csv", alias="format", pattern="^(csv|json)$"),
):
    """
    Export reconciliation report as CSV or JSON.
    Returns all result records for the session with full audit fields.
    """
    results = store.reconciliation_results.get(str(session_id), [])
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No results found for session {session_id}",
        )

    if fmt == "json":
        import json
        from decimal import Decimal
        from datetime import datetime, date

        def _default(obj):
            if isinstance(obj, (Decimal,)):
                return float(obj)
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            if isinstance(obj, UUID):
                return str(obj)
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

        payload = []
        for r in results:
            payload.append({
                "result_id": str(r.id),
                "session_id": str(r.session_id),
                "order_id": (
                    r.settlement.order_id if r.settlement else
                    r.invoice.order_id if r.invoice else
                    r.bank_transaction.extracted_order_id if r.bank_transaction else "N/A"
                ),
                "invoice_id": r.invoice.invoice_id if r.invoice else None,
                "customer_name": r.invoice.customer_name if r.invoice else None,
                "settlement_id": r.settlement.settlement_id if r.settlement else None,
                "bank_reference": r.bank_transaction.reference if r.bank_transaction else None,
                "match_type": r.match_type.value,
                "status": r.status.value,
                "confidence_score": r.confidence_score,
                "amount_difference": float(r.amount_difference) if r.amount_difference is not None else None,
                "ai_explanation": r.ai_explanation,
                "reviewed_by": r.reviewed_by,
                "review_action": r.review_action.value if r.review_action else None,
                "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None,
                "created_at": r.created_at.isoformat(),
            })
        return Response(
            content=json.dumps(payload, default=_default, indent=2),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=reconciliation_{session_id}.json"
            },
        )

    # ── CSV export ─────────────────────────────────────────────────────────────
    fieldnames = [
        "result_id", "order_id", "invoice_id", "customer_name",
        "settlement_id", "bank_reference",
        "match_type", "status", "confidence_score",
        "invoice_amount", "gateway_net", "bank_credit", "amount_difference",
        "ai_explanation", "review_action", "reviewed_at",
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for r in results:
        order_id = (
            r.settlement.order_id if r.settlement else
            r.invoice.order_id if r.invoice else
            (r.bank_transaction.extracted_order_id if r.bank_transaction else "N/A")
        )
        writer.writerow({
            "result_id": str(r.id),
            "order_id": order_id,
            "invoice_id": r.invoice.invoice_id if r.invoice else "",
            "customer_name": r.invoice.customer_name if r.invoice else "",
            "settlement_id": r.settlement.settlement_id if r.settlement else "",
            "bank_reference": r.bank_transaction.reference if r.bank_transaction else "",
            "match_type": r.match_type.value,
            "status": r.status.value,
            "confidence_score": r.confidence_score,
            "invoice_amount": float(r.invoice.total_amount) if r.invoice else "",
            "gateway_net": float(r.settlement.net_amount) if r.settlement else "",
            "bank_credit": float(r.bank_transaction.credit) if r.bank_transaction else "",
            "amount_difference": float(r.amount_difference) if r.amount_difference is not None else "",
            "ai_explanation": r.ai_explanation or "",
            "review_action": r.review_action.value if r.review_action else "",
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else "",
        })

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=reconciliation_{session_id}.csv"
        },
    )


@router.get("/{session_id}/summary")
async def get_reconciliation_summary(session_id: UUID):
    """
    Quick summary: match rate, counts, and the full exception list for a session.
    Delivers the 'measured accuracy + honest exception list' required by the brief.
    """
    results = store.reconciliation_results.get(str(session_id), [])
    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No results found for session {session_id}",
        )

    total = len(results)
    matched = sum(1 for r in results if r.status == MatchStatus.MATCHED)
    review = sum(1 for r in results if r.status == MatchStatus.REVIEW_REQUIRED)
    exceptions = [r for r in results if r.status == MatchStatus.EXCEPTION]

    match_rate = round(matched / total * 100, 1) if total > 0 else 0.0

    exception_list = []
    for r in exceptions:
        order_id = (
            r.settlement.order_id if r.settlement else
            r.invoice.order_id if r.invoice else
            (r.bank_transaction.extracted_order_id if r.bank_transaction else "N/A")
        )
        exception_list.append({
            "result_id": str(r.id),
            "order_id": order_id,
            "confidence_score": r.confidence_score,
            "explanation": r.ai_explanation or "No explanation available.",
        })

    return {
        "session_id": str(session_id),
        "total_records": total,
        "matched": matched,
        "review_required": review,
        "exceptions": len(exceptions),
        "match_rate_pct": match_rate,
        "exception_list": exception_list,
    }
