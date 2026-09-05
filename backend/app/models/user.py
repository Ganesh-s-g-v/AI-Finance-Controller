from typing import Optional, List
from enum import Enum
from datetime import datetime
from uuid import UUID, uuid4
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    CONTROLLER = "CONTROLLER"
    AUDITOR = "AUDITOR"
    ANALYST = "ANALYST"


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.CONTROLLER
    company_name: Optional[str] = "Acme Global Financials"
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(UserBase):
    id: UUID
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class CompanyModel(BaseModel):
    id: str
    name: str
    industry: str = "Financial Services & Commerce"
    match_rate: int = 0
    total_records: int = 0
    anomaly_status: str = "NONE"  # NONE, PENDING, RESOLVED
    match_status: str = "MATCHED"  # MATCHED, REVIEW_REQUIRED, EXCEPTION
    invoice_amount: float = 0.0
    razorpay_amount: float = 0.0
    bank_amount: float = 0.0
    last_reconciled: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    industry: Optional[str] = "Technology & Services"


class UserSessionHistoryItem(BaseModel):
    session_id: UUID
    company_name: str
    created_at: datetime
    total_records: int
    matched: int
    review_required: int
    exceptions: int
    match_rate: float
    processing_time_ms: int
    status: str = "COMPLETED"

    model_config = ConfigDict(from_attributes=True)
