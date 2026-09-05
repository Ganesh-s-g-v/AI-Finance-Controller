"""
In-memory and Database-backed store for the AI Finance Controller.

Provides instant in-memory read/write performance combined with persistent
SQLAlchemy storage (SQLite/PostgreSQL) so users can log back in and resume
their historical sessions, upload batches, and company audit profiles.
"""
from typing import Dict, List, Optional, Any
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
        if db_res and db_res.data_json:
            return ReconciliationResultItem.model_validate_json(db_res.data_json)
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
            if updated_item:
                db_res.data_json = updated_item.model_dump_json()
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

    # Persist to database
    db = SessionLocal()
    try:
        db_session = db.query(ReconciliationSessionDB).filter(ReconciliationSessionDB.session_id == sid).first()
        if not db_session:
            db_session = ReconciliationSessionDB(
                session_id=sid,
                user_id=user_id,
                company_name=company,
                bank_upload_id=str(session_data.get("bank_upload_id", "")),
                razorpay_upload_id=str(session_data.get("razorpay_upload_id", "")),
                invoice_upload_id=str(session_data.get("invoice_upload_id", "")),
                total_records=session_data.get("total_records", len(results)),
                matched=session_data.get("matched", 0),
                review_required=session_data.get("review_required", 0),
                exceptions=session_data.get("exceptions", 0),
                processing_time_ms=session_data.get("processing_time_ms", 0),
                status=session_data.get("status", "COMPLETED"),
                created_at=session_data.get("created_at", datetime.now(timezone.utc)),
            )
            db.add(db_session)
        else:
            db_session.user_id = user_id
            db_session.company_name = company
            db_session.matched = session_data.get("matched", db_session.matched)
            db_session.review_required = session_data.get("review_required", db_session.review_required)
            db_session.exceptions = session_data.get("exceptions", db_session.exceptions)

        # Batch insert results
        for item in results:
            item_id = str(item.id)
            existing_res = db.query(ReconciliationResultDB).filter(ReconciliationResultDB.id == item_id).first()
            if not existing_res:
                db_item = ReconciliationResultDB(
                    id=item_id,
                    session_id=sid,
                    invoice_id=str(item.invoice_id) if item.invoice_id else None,
                    settlement_id=str(item.settlement_id) if item.settlement_id else None,
                    bank_txn_id=str(item.bank_txn_id) if item.bank_txn_id else None,
                    match_type=item.match_type.value if hasattr(item.match_type, "value") else str(item.match_type),
                    confidence_score=item.confidence_score,
                    status=item.status.value if hasattr(item.status, "value") else str(item.status),
                    matched_on_json=json.dumps(item.matched_on) if item.matched_on else None,
                    amount_difference=float(item.amount_difference) if item.amount_difference is not None else None,
                    ai_explanation=item.ai_explanation,
                    reviewed_by=item.reviewed_by,
                    reviewed_at=item.reviewed_at,
                    review_action=item.review_action.value if item.review_action and hasattr(item.review_action, "value") else None,
                    data_json=item.model_dump_json(),
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
    """Retrieve full chronological session history for the active user or all sessions."""
    db = SessionLocal()
    history: List[UserSessionHistoryItem] = []
    try:
        query = db.query(ReconciliationSessionDB)
        if user_id:
            query = query.filter(
                (ReconciliationSessionDB.user_id == user_id) | (ReconciliationSessionDB.user_id.is_(None))
            )
        db_sessions = query.order_by(ReconciliationSessionDB.created_at.desc()).all()

        for s in db_sessions:
            total = s.total_records or 1
            rate = round((s.matched / total) * 100, 1) if total > 0 else 0.0
            history.append(
                UserSessionHistoryItem(
                    session_id=UUID(s.session_id),
                    company_name=s.company_name or "Apex Technologies Pvt Ltd",
                    created_at=s.created_at or datetime.now(timezone.utc),
                    total_records=s.total_records or 0,
                    matched=s.matched or 0,
                    review_required=s.review_required or 0,
                    exceptions=s.exceptions or 0,
                    match_rate=rate,
                    processing_time_ms=s.processing_time_ms or 0,
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
        db_session = db.query(ReconciliationSessionDB).filter(ReconciliationSessionDB.session_id == session_id).first()
        if not db_session:
            return False

        reconciliation_sessions[session_id] = {
            "session_id": UUID(db_session.session_id),
            "user_id": db_session.user_id,
            "company_name": db_session.company_name,
            "bank_upload_id": UUID(db_session.bank_upload_id) if db_session.bank_upload_id else None,
            "razorpay_upload_id": UUID(db_session.razorpay_upload_id) if db_session.razorpay_upload_id else None,
            "invoice_upload_id": UUID(db_session.invoice_upload_id) if db_session.invoice_upload_id else None,
            "total_records": db_session.total_records,
            "matched": db_session.matched,
            "review_required": db_session.review_required,
            "exceptions": db_session.exceptions,
            "processing_time_ms": db_session.processing_time_ms,
            "status": db_session.status,
            "created_at": db_session.created_at,
        }

        db_results = db.query(ReconciliationResultDB).filter(ReconciliationResultDB.session_id == session_id).all()
        items: List[ReconciliationResultItem] = []
        for r in db_results:
            if r.data_json:
                items.append(ReconciliationResultItem.model_validate_json(r.data_json))
        reconciliation_results[session_id] = items
        return True
    except Exception as e:
        logger.error(f"Error restoring session {session_id}: {e}")
        return False
    finally:
        db.close()
