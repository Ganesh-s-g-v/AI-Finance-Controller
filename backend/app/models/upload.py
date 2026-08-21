from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.models.common import ValidationErrorItem


class SourceType(str, Enum):
    BANK = "bank"
    RAZORPAY = "razorpay"
    INVOICE = "invoice"


class UploadSessionStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"
    ERROR = "ERROR"


class UploadSessionResponse(BaseModel):
    session_id: str
    source_type: SourceType
    record_count: int
    validation_errors: List[ValidationErrorItem] = []
    duplicate_count: int = 0
