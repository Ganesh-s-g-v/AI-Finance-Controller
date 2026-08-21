from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel

T = TypeVar("T")


class ValidationErrorItem(BaseModel):
    row: Optional[int] = None
    field: Optional[str] = None
    error: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[List[ValidationErrorItem]] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
