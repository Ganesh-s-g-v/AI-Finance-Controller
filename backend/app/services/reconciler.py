"""
Reconciliation Engine

Implements the three-source deterministic reconciliation algorithm:
  Step 1: Match Invoice ↔ Razorpay by order_id
  Step 2: Match Razorpay ↔ Bank by order_id + net_amount + settlement_date
  Step 3: Link all three; unmatched records become EXCEPTION entries

Confidence scoring follows the locked rules in ARCHITECTURE.md.
"""
import uuid
import time
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from app import store
from app.models.reconciliation import (
    MatchStatus,
    MatchType,
    ReconciliationResultItem,
    ReconciliationSummaryResponse,
)
from app.models.transaction import (
    BankTransactionModel,
    InvoiceModel,
    RazorpaySettlementModel,
)


# ── Confidence scoring weights (locked in ARCHITECTURE.md) ────────────────────
SCORE_ORDER_ID_MATCH = 40
SCORE_AMOUNT_MATCH = 25       # within ₹1
SCORE_DATE_SAME_DAY = 15
SCORE_DATE_PROXIMITY = 10     # ≤ 3 days
SCORE_REFERENCE_MATCH = 10

PENALTY_AMOUNT_MISMATCH = -20   # > ₹1
PENALTY_DATE_MISMATCH = -10     # > 3 days
PENALTY_NO_ORDER_ID = -30


def _days_apart(d1, d2) -> int:
    return abs((d1 - d2).days)


def _score(
    invoice: Optional[InvoiceModel],
    settlement: Optional[RazorpaySettlementModel],
    bank: Optional[BankTransactionModel],
) -> int:
    score = 0

    # order_id presence / match
    order_ids = set()
    if invoice:
        order_ids.add(invoice.order_id)
    if settlement:
        order_ids.add(settlement.order_id)
    if bank and bank.extracted_order_id:
        order_ids.add(bank.extracted_order_id)

    if len(order_ids) == 1 and order_ids:
        score += SCORE_ORDER_ID_MATCH
    elif not order_ids or (bank and not bank.extracted_order_id):
        score += PENALTY_NO_ORDER_ID

    # Amount match: compare invoice.total_amount vs settlement.gross_amount
    if invoice and settlement:
        diff = abs(invoice.total_amount - settlement.gross_amount)
        if diff <= Decimal("1.00"):
            score += SCORE_AMOUNT_MATCH
        else:
            score += PENALTY_AMOUNT_MISMATCH

    # Date match: settlement_date vs bank.txn_date
    if settlement and bank:
        days = _days_apart(settlement.settlement_date, bank.txn_date)
        if days == 0:
            score += SCORE_DATE_SAME_DAY
        elif days <= 3:
            score += SCORE_DATE_PROXIMITY
        else:
            score += PENALTY_DATE_MISMATCH

    # Reference / UTR match
    if bank and settlement and bank.reference:
        if settlement.order_id in (bank.reference or "") or settlement.settlement_id in (bank.reference or ""):
            score += SCORE_REFERENCE_MATCH

    return max(0, min(100, score))


def _status_from_score(score: int) -> MatchStatus:
    if score >= 80:
        return MatchStatus.MATCHED
    if score >= 60:
        return MatchStatus.REVIEW_REQUIRED
    return MatchStatus.EXCEPTION


def _build_explanation(
    invoice: Optional[InvoiceModel],
    settlement: Optional[RazorpaySettlementModel],
    bank: Optional[BankTransactionModel],
    score: int,
    status: MatchStatus,
    amount_diff: Optional[Decimal],
) -> str:
    """Generate a plain-English audit explanation for a reconciliation result."""
    order_id = (
        (settlement.order_id if settlement else None)
        or (invoice.order_id if invoice else None)
        or (bank.extracted_order_id if bank else None)
        or "UNKNOWN"
    )

    parts = []

    if status == MatchStatus.MATCHED:
        customer = invoice.customer_name if invoice else "Unknown Customer"
        inv_amt = f"₹{invoice.total_amount:,.2f}" if invoice else "N/A"
        settl_net = f"₹{settlement.net_amount:,.2f}" if settlement else "N/A"
        fee_total = (settlement.fee + settlement.tax) if settlement else Decimal("0")
        bank_credit = f"₹{bank.credit:,.2f}" if bank else "N/A"
        parts.append(
            f"FULL MATCH — {order_id}: {customer}. "
            f"Invoice {inv_amt}, Gateway net {settl_net} (fees ₹{fee_total:,.2f}), "
            f"Bank credit {bank_credit}. Score {score}/100."
        )

    elif status == MatchStatus.REVIEW_REQUIRED:
        reasons = []
        if invoice and settlement:
            diff = abs(invoice.total_amount - settlement.gross_amount)
            if diff > Decimal("1.00"):
                reasons.append(f"amount delta ₹{diff:,.2f} between invoice and gateway")
        if settlement and bank:
            days = _days_apart(settlement.settlement_date, bank.txn_date)
            if days > 0:
                reasons.append(f"{days}-day gap between settlement ({settlement.settlement_date}) and bank credit ({bank.txn_date})")
        if not invoice:
            reasons.append("no matching invoice found")
        if not bank:
            reasons.append("no bank credit found")
        reason_str = "; ".join(reasons) if reasons else "minor discrepancy detected"
        parts.append(
            f"REVIEW REQUIRED — {order_id}: {reason_str.capitalize()}. Score {score}/100. Manual verification recommended."
        )

    else:  # EXCEPTION
        if invoice and not settlement and not bank:
            parts.append(
                f"EXCEPTION — {order_id}: Invoice {invoice.invoice_id} (₹{invoice.total_amount:,.2f}) "
                f"for {invoice.customer_name} has no matching Razorpay settlement or bank credit. "
                f"Possible missed payment or wrong order_id on gateway."
            )
        elif settlement and not invoice and not bank:
            parts.append(
                f"EXCEPTION — {order_id}: Razorpay settlement {settlement.settlement_id} "
                f"(net ₹{settlement.net_amount:,.2f}, date {settlement.settlement_date}) "
                f"has no invoice or bank credit. Possible refund or unrecorded transaction."
            )
        elif bank and not invoice and not settlement:
            desc = bank.description or "No description"
            ref = bank.reference or "No reference"
            parts.append(
                f"EXCEPTION — Unmatched bank credit ₹{bank.credit:,.2f} on {bank.txn_date}. "
                f"Description: \"{desc}\". Ref: {ref}. No Razorpay or invoice match. "
                f"Possible NEFT from unknown source."
            )
        elif settlement and not bank:
            parts.append(
                f"EXCEPTION — {order_id}: Settlement {settlement.settlement_id} "
                f"(₹{settlement.net_amount:,.2f} on {settlement.settlement_date}) "
                f"has no corresponding bank credit. Check if settlement transfer is pending."
            )
        else:
            parts.append(
                f"EXCEPTION — {order_id}: Unable to reconcile across available sources. "
                f"Score {score}/100. Manual investigation required."
            )

    return " ".join(parts)


def run_reconciliation(
    recon_session_id: str,
    bank_upload_id: str,
    razorpay_upload_id: str,
    invoice_upload_id: str,
    company_name: Optional[str] = None,
    user_id: Optional[str] = None,
) -> ReconciliationSummaryResponse:
    """
    Execute the 3-step reconciliation and populate store.reconciliation_results.
    Returns a summary.
    """
    t_start = time.perf_counter()

    invoices: List[InvoiceModel] = store.invoices.get(invoice_upload_id, [])
    settlements: List[RazorpaySettlementModel] = store.razorpay_settlements.get(razorpay_upload_id, [])
    bank_txns: List[BankTransactionModel] = store.bank_transactions.get(bank_upload_id, [])

    results: List[ReconciliationResultItem] = []

    # Index by order_id for O(1) lookup
    inv_by_order = {inv.order_id: inv for inv in invoices}
    bank_by_order = {b.extracted_order_id: b for b in bank_txns if b.extracted_order_id}

    matched_invoice_ids: set = set()
    matched_settlement_ids: set = set()
    matched_bank_ids: set = set()

    # ── Step 1 & 2: Iterate settlements as the anchor ─────────────────────────
    for settlement in settlements:
        invoice = inv_by_order.get(settlement.order_id)
        bank = bank_by_order.get(settlement.order_id)

        score = _score(invoice, settlement, bank)
        status = _status_from_score(score)

        matched_on = {"order_id": settlement.order_id}
        amount_diff = None
        if invoice:
            amount_diff = abs(invoice.total_amount - settlement.gross_amount)
            matched_invoice_ids.add(invoice.id)
        if bank:
            matched_bank_ids.add(bank.id)
        matched_settlement_ids.add(settlement.id)

        match_type = (
            MatchType.FULL if (invoice and bank)
            else MatchType.PARTIAL if (invoice or bank)
            else MatchType.NONE
        )

        explanation = _build_explanation(invoice, settlement, bank, score, status, amount_diff)

        results.append(
            ReconciliationResultItem(
                id=uuid.uuid4(),
                session_id=uuid.UUID(recon_session_id),
                invoice_id=invoice.id if invoice else None,
                settlement_id=settlement.id,
                bank_txn_id=bank.id if bank else None,
                match_type=match_type,
                confidence_score=score,
                status=status,
                matched_on=matched_on,
                amount_difference=amount_diff,
                ai_explanation=explanation,
                invoice=invoice,
                settlement=settlement,
                bank_transaction=bank,
                created_at=datetime.utcnow(),
            )
        )

    # ── Step 3: Unmatched invoices → EXCEPTION ────────────────────────────────
    for invoice in invoices:
        if invoice.id in matched_invoice_ids:
            continue
        score = _score(invoice, None, None)
        explanation = _build_explanation(invoice, None, None, score, MatchStatus.EXCEPTION, None)
        results.append(
            ReconciliationResultItem(
                id=uuid.uuid4(),
                session_id=uuid.UUID(recon_session_id),
                invoice_id=invoice.id,
                settlement_id=None,
                bank_txn_id=None,
                match_type=MatchType.NONE,
                confidence_score=score,
                status=MatchStatus.EXCEPTION,
                matched_on=None,
                ai_explanation=explanation,
                invoice=invoice,
                created_at=datetime.utcnow(),
            )
        )

    # ── Step 3b: Unmatched bank txns → EXCEPTION ─────────────────────────────
    for bank in bank_txns:
        if bank.id in matched_bank_ids:
            continue
        score = _score(None, None, bank)
        explanation = _build_explanation(None, None, bank, score, MatchStatus.EXCEPTION, None)
        results.append(
            ReconciliationResultItem(
                id=uuid.uuid4(),
                session_id=uuid.UUID(recon_session_id),
                invoice_id=None,
                settlement_id=None,
                bank_txn_id=bank.id,
                match_type=MatchType.NONE,
                confidence_score=score,
                status=MatchStatus.EXCEPTION,
                matched_on=None,
                ai_explanation=explanation,
                bank_transaction=bank,
                created_at=datetime.utcnow(),
            )
        )

    store.reconciliation_results[recon_session_id] = results

    # ── Counts ────────────────────────────────────────────────────────────────
    matched = sum(1 for r in results if r.status == MatchStatus.MATCHED)
    review = sum(1 for r in results if r.status == MatchStatus.REVIEW_REQUIRED)
    exceptions = sum(1 for r in results if r.status == MatchStatus.EXCEPTION)
    elapsed_ms = int((time.perf_counter() - t_start) * 1000)

    summary = ReconciliationSummaryResponse(
        session_id=uuid.UUID(recon_session_id),
        total_records=len(results),
        matched=matched,
        review_required=review,
        exceptions=exceptions,
        processing_time_ms=elapsed_ms,
    )

    session_meta = {
        "session_id": recon_session_id,
        "bank_upload_id": bank_upload_id,
        "razorpay_upload_id": razorpay_upload_id,
        "invoice_upload_id": invoice_upload_id,
        "total_records": len(results),
        "matched": matched,
        "review_required": review,
        "exceptions": exceptions,
        "processing_time_ms": elapsed_ms,
        "created_at": datetime.utcnow(),
    }

    # Persist session metadata and results to persistent database
    store.persist_reconciliation_session(
        session_meta,
        results,
        user_id=user_id,
        company_name=company_name,
    )

    return summary

