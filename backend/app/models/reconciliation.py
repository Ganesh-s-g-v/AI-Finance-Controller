from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.common import PaginationMeta
from app.models.transaction import BankTransactionModel, RazorpaySettlementModel, InvoiceModel


class MatchType(str, Enum):
    FULL = "FULL"
    PARTIAL = "PARTIAL"
    NONE = "NONE"


class MatchStatus(str, Enum):
    MATCHED = "MATCHED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    EXCEPTION = "EXCEPTION"


class SessionStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class ReviewActionType(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ReconciliationRequest(BaseModel):
    bank_upload_id: UUID
    razorpay_upload_id: UUID
    invoice_upload_id: UUID
    company_name: Optional[str] = None


class ReconciliationSummaryResponse(BaseModel):
    session_id: UUID
    total_records: int
    matched: int
    review_required: int
    exceptions: int
    processing_time_ms: int


class ReconciliationResultItem(BaseModel):
    id: UUID
    session_id: UUID
    invoice_id: Optional[UUID] = None
    settlement_id: Optional[UUID] = None
    bank_txn_id: Optional[UUID] = None
    match_type: MatchType
    confidence_score: int
    status: MatchStatus
    matched_on: Optional[Dict[str, Any]] = None
    amount_difference: Optional[Decimal] = None
    ai_explanation: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_action: Optional[ReviewActionType] = None
    created_at: datetime
    
    # Optional nested details for single item view
    invoice: Optional[InvoiceModel] = None
    settlement: Optional[RazorpaySettlementModel] = None
    bank_transaction: Optional[BankTransactionModel] = None

    model_config = ConfigDict(from_attributes=True)


class ReconciliationResultsListResponse(BaseModel):
    results: List[ReconciliationResultItem]
    pagination: PaginationMeta


class ReviewRequest(BaseModel):
    action: ReviewActionType
    notes: Optional[str] = None


class ReviewResponse(BaseModel):
    result_id: UUID
    status: MatchStatus
    review_action: ReviewActionType
    reviewed_at: datetime


class DashboardSummaryResponse(BaseModel):
    total_transactions: int
    matched: int
    review_required: int
    exceptions: int
    match_rate: float
    total_amount_reconciled: Decimal
    pending_amount: Decimal
    recent_sessions: List[Dict[str, Any]]
