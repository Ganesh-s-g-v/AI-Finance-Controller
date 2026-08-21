from typing import Optional
from enum import Enum
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class InvoiceStatus(str, Enum):
    PAID = "PAID"
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"


class BankTransactionModel(BaseModel):
    id: UUID
    upload_session_id: UUID
    row_number: int
    txn_date: date
    description: str
    reference: Optional[str] = None
    extracted_order_id: Optional[str] = None
    debit: Decimal = Decimal("0.00")
    credit: Decimal = Decimal("0.00")
    balance: Optional[Decimal] = None
    amount: Decimal
    is_reconciled: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RazorpaySettlementModel(BaseModel):
    id: UUID
    upload_session_id: UUID
    row_number: int
    settlement_id: str
    order_id: str
    payment_id: Optional[str] = None
    settlement_date: date
    gross_amount: Decimal
    fee: Decimal
    tax: Decimal
    net_amount: Decimal
    fee_validated: bool
    is_reconciled: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InvoiceModel(BaseModel):
    id: UUID
    upload_session_id: UUID
    row_number: int
    invoice_id: str
    order_id: str
    customer_name: Optional[str] = None
    issue_date: date
    amount: Decimal
    gst_amount: Decimal
    total_amount: Decimal
    status: InvoiceStatus
    is_reconciled: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
