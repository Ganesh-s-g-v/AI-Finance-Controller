"""
In-memory and Database-backed store for the AI Finance Controller.

Provides instant in-memory read/write performance combined with persistent
SQLAlchemy storage (SQLite/PostgreSQL) so users can log back in and resume
their historical sessions, upload batches, and company audit profiles.
"""
from typing import Dict, List, Optional, Any
from decimal import Decimal
from uuid import UUID
from datetime import datetime, timezone
import json
import logging

from app.models.transaction import BankTransactionModel, RazorpaySettlementModel, InvoiceModel
from app.models.reconciliation import ReconciliationResultItem, MatchStatus
from app.models.user import UserSessionHistoryItem, CompanyModel
from app.database import (
    SessionLocal,
    UploadSessionDB,
    ReconciliationSessionDB,
    ReconciliationResultDB,
    CompanyDB,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-Memory Cache for blazing fast access
# ---------------------------------------------------------------------------
upload_sessions: Dict[str, dict] = {}
bank_transactions: Dict[str, List[BankTransactionModel]] = {}
razorpay_settlements: Dict[str, List[RazorpaySettlementModel]] = {}
invoices: Dict[str, List[InvoiceModel]] = {}
reconciliation_sessions: Dict[str, dict] = {}
reconciliation_results: Dict[str, List[ReconciliationResultItem]] = {}


# ---------------------------------------------------------------------------
# Result Lookup and Mutator Helpers
# ---------------------------------------------------------------------------
def _uuid_or_none(value: Any) -> Optional[UUID]:
    """Safely parse a UUID, returning None for empty/invalid values."""
    if not value:
        return None
    try:
        return value if isinstance(value, UUID) else UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        return None


def _result_item_from_db(r: Any) -> ReconciliationResultItem:
    """Rebuild a ReconciliationResultItem from DB columns.

    Nested detail objects (invoice/settlement/bank_transaction) are session-scoped
    and live only in memory, so DB-restored items carry the match data without them.
    """
    matched_on = None
    if getattr(r, "matched_on", None):
        try:
            matched_on = json.loads(r.matched_on)
        except (ValueError, TypeError):
            matched_on = None
    return ReconciliationResultItem(
        id=UUID(str(r.id)),
        session_id=UUID(str(r.session_id)),
        invoice_id=_uuid_or_none(getattr(r, "invoice_id", None)),
        settlement_id=_uuid_or_none(getattr(r, "settlement_id", None)),
        bank_txn_id=_uuid_or_none(getattr(r, "bank_txn_id", None)),
        match_type=r.match_type or "FULL",
        confidence_score=r.confidence_score or 0,
        status=r.status or "MATCHED",
        matched_on=matched_on,
        amount_difference=Decimal(str(r.amount_difference)) if r.amount_difference is not None else None,
        ai_explanation=r.ai_explanation,
        reviewed_by=r.reviewed_by,
        reviewed_at=r.reviewed_at,
        review_action=r.review_action,
        created_at=r.created_at or datetime.now(timezone.utc),
    )


def find_result(result_id: UUID) -> Optional[ReconciliationResultItem]:
    """Return the first ReconciliationResultItem whose .id matches result_id."""
    for items in reconciliation_results.values():
        for item in items:
            if item.id == result_id:
                return item
    # Fallback to DB
    db = SessionLocal()
    try:
        db_res = db.query(ReconciliationResultDB).filter(ReconciliationResultDB.id == str(result_id)).first()
        if db_res:
            return _result_item_from_db(db_res)
    except Exception as e:
        logger.error(f"Error querying result from DB: {e}")
    finally:
        db.close()
    return None


def update_result(result_id: UUID, **kwargs) -> Optional[ReconciliationResultItem]:
    """Mutate a result in-place in memory and database, returning the updated item."""
    updated_item: Optional[ReconciliationResultItem] = None
    target_session_id: Optional[str] = None
    
    for session_id, session_items in reconciliation_results.items():
        for i, item in enumerate(session_items):
            if item.id == result_id:
                updated = item.model_copy(update=kwargs)
                session_items[i] = updated
                updated_item = updated
                target_session_id = session_id
                break
        if updated_item:
            break

    # Persist update to DB
    db = SessionLocal()
    try:
        db_res = db.query(ReconciliationResultDB).filter(ReconciliationResultDB.id == str(result_id)).first()
        if db_res:
            if "status" in kwargs:
                db_res.status = kwargs["status"].value if hasattr(kwargs["status"], "value") else str(kwargs["status"])
            if "reviewed_by" in kwargs:
                db_res.reviewed_by = kwargs["reviewed_by"]
            if "reviewed_at" in kwargs:
                db_res.reviewed_at = kwargs["reviewed_at"]
            if "review_action" in kwargs:
                db_res.review_action = kwargs["review_action"].value if hasattr(kwargs["review_action"], "value") else str(kwargs["review_action"])
            db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating result in DB: {e}")
    finally:
        db.close()

    return updated_item


# ---------------------------------------------------------------------------
# Session Persistence & History Management
# ---------------------------------------------------------------------------
def persist_reconciliation_session(
    session_data: dict,
    results: List[ReconciliationResultItem],
    user_id: Optional[str] = None,
    company_name: Optional[str] = None,
):
    """Save reconciliation session and its result items into memory and DB."""
    sid = str(session_data["session_id"])
    company = company_name or session_data.get("company_name", "Apex Technologies Pvt Ltd")
    
    # Update in-memory cache
    session_data["user_id"] = user_id
    session_data["company_name"] = company
    reconciliation_sessions[sid] = session_data
    reconciliation_results[sid] = results

    # Persist to database (columns mirror the LOCKED Supabase schema).
    # Detail-table FKs stay NULL: V1 never populates those tables, and the
    # session-scoped item UUIDs would otherwise violate FK constraints.
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        started = session_data.get("created_at") or now

        def _fk(uid: Any) -> Optional[str]:
            uid = str(uid) if uid else ""
            if not uid:
                return None
            exists = db.query(UploadSessionDB).filter(UploadSessionDB.id == uid).first()
            return uid if exists else None

        db_session = db.query(ReconciliationSessionDB).filter(ReconciliationSessionDB.id == sid).first()
        if not db_session:
            db_session = ReconciliationSessionDB(
                id=sid,
                bank_upload_id=_fk(session_data.get("bank_upload_id")),
                razorpay_upload_id=_fk(session_data.get("razorpay_upload_id")),
                invoice_upload_id=_fk(session_data.get("invoice_upload_id")),
                total_records=session_data.get("total_records", len(results)),
                matched_count=session_data.get("matched", 0),
                review_count=session_data.get("review_required", 0),
                exception_count=session_data.get("exceptions", 0),
                status=session_data.get("status", "COMPLETED"),
                started_at=started,
                completed_at=now,
            )
            db.add(db_session)
        else:
            db_session.matched_count = session_data.get("matched", db_session.matched_count)
            db_session.review_count = session_data.get("review_required", db_session.review_count)
            db_session.exception_count = session_data.get("exceptions", db_session.exception_count)
            db_session.completed_at = now

        # Flush the parent row first: the models declare no ForeignKey metadata,
        # so the unit-of-work cannot order parent/child inserts by itself.
        db.flush()

        # Batch insert results
        for item in results:
            item_id = str(item.id)
            existing_res = db.query(ReconciliationResultDB).filter(ReconciliationResultDB.id == item_id).first()
            if not existing_res:
                db_item = ReconciliationResultDB(
                    id=item_id,
                    session_id=sid,
                    invoice_id=None,
                    settlement_id=None,
                    bank_txn_id=None,
                    match_type=item.match_type.value if hasattr(item.match_type, "value") else str(item.match_type),
                    confidence_score=item.confidence_score,
                    status=item.status.value if hasattr(item.status, "value") else str(item.status),
                    matched_on=json.dumps(item.matched_on) if item.matched_on else None,
                    amount_difference=float(item.amount_difference) if item.amount_difference is not None else None,
                    ai_explanation=item.ai_explanation,
                    reviewed_by=item.reviewed_by,
                    reviewed_at=item.reviewed_at,
                    review_action=item.review_action.value if item.review_action and hasattr(item.review_action, "value") else None,
                    created_at=item.created_at,
                )
                db.add(db_item)

        # Update or Create Company record with live statistics from this session
        total_rec = len(results)
        matched_cnt = session_data.get("matched", 0)
        match_pct = round((matched_cnt / total_rec) * 100) if total_rec > 0 else 100
        
        inv_amt = sum(float(r.invoice.total_amount) for r in results if r.invoice and r.invoice.total_amount)
        settl_amt = sum(float(r.settlement.net_amount) for r in results if r.settlement and r.settlement.net_amount)
        bank_amt = sum(float(r.bank_transaction.credit) for r in results if r.bank_transaction and r.bank_transaction.credit)

        comp = db.query(CompanyDB).filter(CompanyDB.name == company).first()
        if not comp:
            from uuid import uuid4
            comp = CompanyDB(
                id=f"c-{uuid4().hex[:6]}",
                name=company,
                industry="Enterprise Client Workspace",
                match_rate=match_pct,
                total_records=total_rec,
                anomaly_status="PENDING" if session_data.get("exceptions", 0) > 0 else "NONE",
                match_status="MATCHED" if match_pct >= 90 else ("REVIEW_REQUIRED" if match_pct >= 70 else "EXCEPTION"),
                invoice_amount=inv_amt,
                razorpay_amount=settl_amt,
                bank_amount=bank_amt,
                created_at=datetime.now(timezone.utc),
            )
            db.add(comp)
        else:
            comp.match_rate = match_pct
            comp.total_records = total_rec
            comp.anomaly_status = "PENDING" if session_data.get("exceptions", 0) > 0 else "NONE"
            comp.match_status = "MATCHED" if match_pct >= 90 else ("REVIEW_REQUIRED" if match_pct >= 70 else "EXCEPTION")
            if inv_amt > 0:
                comp.invoice_amount = inv_amt
            if settl_amt > 0:
                comp.razorpay_amount = settl_amt
            if bank_amt > 0:
                comp.bank_amount = bank_amt

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error persisting reconciliation session to DB: {e}")
    finally:
        db.close()


def get_user_session_history(user_id: Optional[str] = None) -> List[UserSessionHistoryItem]:
    """Retrieve full chronological session history.

    NOTE: the LOCKED schema has no per-session user/company columns (auth is
    deferred for V1), so history returns all sessions newest-first.
    """
    db = SessionLocal()
    history: List[UserSessionHistoryItem] = []
    try:
        db_sessions = db.query(ReconciliationSessionDB).order_by(ReconciliationSessionDB.started_at.desc()).all()

        for s in db_sessions:
            total = s.total_records or 0
            matched = s.matched_count or 0
            rate = round((matched / total) * 100, 1) if total > 0 else 0.0
            history.append(
                UserSessionHistoryItem(
                    session_id=UUID(str(s.id)),
                    company_name="Apex Technologies Pvt Ltd",
                    created_at=s.started_at or datetime.now(timezone.utc),
                    total_records=total,
                    matched=matched,
                    review_required=s.review_count or 0,
                    exceptions=s.exception_count or 0,
                    match_rate=rate,
                    processing_time_ms=0,
                    status=s.status or "COMPLETED",
                )
            )
    except Exception as e:
        logger.error(f"Error fetching session history: {e}")
    finally:
        db.close()

    # If DB is empty, pull from memory
    if not history:
        for sid, s in reconciliation_sessions.items():
            total = s.get("total_records", 0) or 1
            matched = s.get("matched", 0)
            rate = round((matched / total) * 100, 1)
            history.append(
                UserSessionHistoryItem(
                    session_id=UUID(sid),
                    company_name=s.get("company_name", "Apex Technologies Pvt Ltd"),
                    created_at=s.get("created_at", datetime.now(timezone.utc)),
                    total_records=s.get("total_records", 0),
                    matched=matched,
                    review_required=s.get("review_required", 0),
                    exceptions=s.get("exceptions", 0),
                    match_rate=rate,
                    processing_time_ms=s.get("processing_time_ms", 0),
                    status=s.get("status", "COMPLETED"),
                )
            )
    return history


def restore_session_to_memory(session_id: str) -> bool:
    """Load a session and all its results from DB back into memory cache for instant workspace work."""
    if session_id in reconciliation_sessions and session_id in reconciliation_results:
        return True

    db = SessionLocal()
    try:
        db_session = db.query(ReconciliationSessionDB).filter(ReconciliationSessionDB.id == session_id).first()
        if not db_session:
            return False

        reconciliation_sessions[session_id] = {
            "session_id": session_id,
            "company_name": "Apex Technologies Pvt Ltd",
            "bank_upload_id": db_session.bank_upload_id,
            "razorpay_upload_id": db_session.razorpay_upload_id,
            "invoice_upload_id": db_session.invoice_upload_id,
            "total_records": db_session.total_records,
            "matched": db_session.matched_count or 0,
            "review_required": db_session.review_count or 0,
            "exceptions": db_session.exception_count or 0,
            "processing_time_ms": 0,
            "status": db_session.status or "COMPLETED",
            "created_at": db_session.started_at,
        }

        db_results = db.query(ReconciliationResultDB).filter(ReconciliationResultDB.session_id == session_id).all()
        reconciliation_results[session_id] = [_result_item_from_db(r) for r in db_results]
        return True
    except Exception as e:
        logger.error(f"Error restoring session {session_id}: {e}")
        return False
    finally:
        db.close()
