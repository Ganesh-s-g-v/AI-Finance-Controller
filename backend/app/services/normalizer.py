"""
CSV Normalizer Service

Parses and validates uploaded CSV files for each source type,
applies business rules, and writes records into the in-memory store.
"""
import csv
import io
import uuid
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import List, Tuple

from app import store
from app.models.common import ValidationErrorItem
from app.models.transaction import (
    BankTransactionModel,
    InvoiceModel,
    InvoiceStatus,
    RazorpaySettlementModel,
)
from app.utils.date_parser import parse_financial_date
from app.utils.validators import extract_order_id


# ── Expected CSV headers ──────────────────────────────────────────────────────

BANK_HEADERS = {"txn_date", "description", "reference", "debit", "credit", "balance"}
RAZORPAY_HEADERS = {
    "settlement_id", "order_id", "payment_id",
    "settlement_date", "gross_amount", "fee", "tax", "net_amount",
}
INVOICE_HEADERS = {
    "invoice_id", "order_id", "customer_name",
    "issue_date", "amount", "gst_amount", "total_amount", "status",
}


def _dec(value: str, default: str = "0.00") -> Decimal:
    try:
        return Decimal(value.strip())
    except (InvalidOperation, AttributeError):
        return Decimal(default)


def normalize_bank(
    session_id: str, content: bytes
) -> Tuple[int, int, List[ValidationErrorItem]]:
    """Parse bank statement CSV. Returns (record_count, duplicate_count, errors)."""
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    # Header validation
    if not reader.fieldnames or not BANK_HEADERS.issubset(
        {h.strip().lower() for h in reader.fieldnames}
    ):
        return 0, 0, [ValidationErrorItem(row=0, field="header", error="Missing required columns")]

    records: List[BankTransactionModel] = []
    errors: List[ValidationErrorItem] = []
    seen_refs: set = set()
    duplicate_count = 0

    for row_num, row in enumerate(reader, start=2):
        # Deduplicate on (txn_date + reference + amount)
        ref = (row.get("reference") or "").strip()
        debit = _dec(row.get("debit", "0"))
        credit = _dec(row.get("credit", "0"))
        amount = credit if credit > 0 else debit
        txn_date_raw = (row.get("txn_date") or "").strip()
        dup_key = f"{txn_date_raw}|{ref}|{amount}"

        if dup_key in seen_refs and ref:
            duplicate_count += 1
            continue
        if ref:
            seen_refs.add(dup_key)

        txn_date = parse_financial_date(txn_date_raw)
        if not txn_date:
            errors.append(ValidationErrorItem(row=row_num, field="txn_date", error=f"Invalid date: {txn_date_raw}"))
            continue

        description = (row.get("description") or "").strip()
        extracted_order_id = extract_order_id(ref, description)
        balance_raw = (row.get("balance") or "").strip()

        records.append(
            BankTransactionModel(
                id=uuid.uuid4(),
                upload_session_id=uuid.UUID(session_id),
                row_number=row_num,
                txn_date=txn_date,
                description=description,
                reference=ref or None,
                extracted_order_id=extracted_order_id,
                debit=debit,
                credit=credit,
                balance=_dec(balance_raw) if balance_raw else None,
                amount=amount,
                created_at=datetime.utcnow(),
            )
        )

    store.bank_transactions[session_id] = records
    return len(records), duplicate_count, errors


def normalize_razorpay(
    session_id: str, content: bytes
) -> Tuple[int, int, List[ValidationErrorItem]]:
    """Parse Razorpay settlement CSV. Returns (record_count, duplicate_count, errors)."""
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames or not RAZORPAY_HEADERS.issubset(
        {h.strip().lower() for h in reader.fieldnames}
    ):
        return 0, 0, [ValidationErrorItem(row=0, field="header", error="Missing required columns")]

    records: List[RazorpaySettlementModel] = []
    errors: List[ValidationErrorItem] = []
    seen_settlement_ids: set = set()
    duplicate_count = 0

    for row_num, row in enumerate(reader, start=2):
        settlement_id = (row.get("settlement_id") or "").strip()
        if not settlement_id:
            errors.append(ValidationErrorItem(row=row_num, field="settlement_id", error="Missing settlement_id"))
            continue
        if settlement_id in seen_settlement_ids:
            duplicate_count += 1
            continue
        seen_settlement_ids.add(settlement_id)

        settlement_date = parse_financial_date((row.get("settlement_date") or "").strip())
        if not settlement_date:
            errors.append(ValidationErrorItem(row=row_num, field="settlement_date", error="Invalid date"))
            continue

        gross = _dec(row.get("gross_amount", "0"))
        fee = _dec(row.get("fee", "0"))
        tax = _dec(row.get("tax", "0"))
        net = _dec(row.get("net_amount", "0"))

        # Fee validation rule: net == gross - fee - tax (±₹0.01)
        expected_net = gross - fee - tax
        fee_validated = abs(net - expected_net) <= Decimal("0.01")

        records.append(
            RazorpaySettlementModel(
                id=uuid.uuid4(),
                upload_session_id=uuid.UUID(session_id),
                row_number=row_num,
                settlement_id=settlement_id,
                order_id=(row.get("order_id") or "").strip().upper(),
                payment_id=(row.get("payment_id") or "").strip() or None,
                settlement_date=settlement_date,
                gross_amount=gross,
                fee=fee,
                tax=tax,
                net_amount=net,
                fee_validated=fee_validated,
                created_at=datetime.utcnow(),
            )
        )

    store.razorpay_settlements[session_id] = records
    return len(records), duplicate_count, errors


def normalize_invoice(
    session_id: str, content: bytes
) -> Tuple[int, int, List[ValidationErrorItem]]:
    """Parse invoice CSV. Returns (record_count, duplicate_count, errors).
    Only PAID invoices are stored for reconciliation; others are counted but skipped.
    """
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames or not INVOICE_HEADERS.issubset(
        {h.strip().lower() for h in reader.fieldnames}
    ):
        return 0, 0, [ValidationErrorItem(row=0, field="header", error="Missing required columns")]

    records: List[InvoiceModel] = []
    errors: List[ValidationErrorItem] = []
    seen_invoice_ids: set = set()
    duplicate_count = 0

    for row_num, row in enumerate(reader, start=2):
        invoice_id = (row.get("invoice_id") or "").strip()
        if not invoice_id:
            errors.append(ValidationErrorItem(row=row_num, field="invoice_id", error="Missing invoice_id"))
            continue
        if invoice_id in seen_invoice_ids:
            duplicate_count += 1
            continue
        seen_invoice_ids.add(invoice_id)

        issue_date = parse_financial_date((row.get("issue_date") or "").strip())
        if not issue_date:
            errors.append(ValidationErrorItem(row=row_num, field="issue_date", error="Invalid date"))
            continue

        status_raw = (row.get("status") or "").strip().upper()
        try:
            status = InvoiceStatus(status_raw)
        except ValueError:
            errors.append(ValidationErrorItem(row=row_num, field="status", error=f"Unknown status: {status_raw}"))
            continue

        # Only store PAID invoices for reconciliation
        if status != InvoiceStatus.PAID:
            continue

        amount = _dec(row.get("amount", "0"))
        gst = _dec(row.get("gst_amount", "0"))
        total = _dec(row.get("total_amount", "0"))

        records.append(
            InvoiceModel(
                id=uuid.uuid4(),
                upload_session_id=uuid.UUID(session_id),
                row_number=row_num,
                invoice_id=invoice_id,
                order_id=(row.get("order_id") or "").strip().upper(),
                customer_name=(row.get("customer_name") or "").strip() or None,
                issue_date=issue_date,
                amount=amount,
                gst_amount=gst,
                total_amount=total,
                status=status,
                created_at=datetime.utcnow(),
            )
        )

    store.invoices[session_id] = records
    return len(records), duplicate_count, errors

