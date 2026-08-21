from uuid import UUID
from fastapi import APIRouter, Query, Response, HTTPException, status
from fastapi.responses import PlainTextResponse

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{session_id}/export")
async def export_reconciliation_report(
    session_id: UUID,
    format: str = Query("csv", regex="^(csv|json)$"),
):
    """
    Export reconciliation report as CSV or JSON.
    """
    if format == "csv":
        sample_csv = "result_id,invoice_id,settlement_id,bank_txn_id,status,confidence_score,amount_difference\n"
        return Response(
            content=sample_csv,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=reconciliation_report_{session_id}.csv"}
        )
    
    return {"session_id": str(session_id), "status": "COMPLETED", "records": []}
