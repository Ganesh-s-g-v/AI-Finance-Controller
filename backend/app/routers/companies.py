from typing import List, Optional
from uuid import uuid4
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db, CompanyDB
from app.models.common import ApiResponse
from app.models.user import CompanyModel, CompanyCreate
from app.routers.auth import get_current_user_optional, UserDB

router = APIRouter(prefix="/companies", tags=["Multi-Company Management"])


@router.get("", response_model=ApiResponse[List[CompanyModel]])
async def list_companies(
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_current_user_optional),
):
    """Retrieve all company workspaces, audit histories, and match statistics."""
    query = db.query(CompanyDB)
    
    if current_user:
        # If demo/admin user, they can see all demo entities
        is_demo_account = current_user.email in [
            "cfo@financecontroller.ai",
            "auditor@financecontroller.ai",
            "admin@financecontroller.ai",
            "sarah@apex.io",
        ]
        if not is_demo_account:
            # Regular user only sees their own company or companies they created
            query = query.filter(
                (CompanyDB.user_id == current_user.id) |
                (CompanyDB.name == current_user.company_name)
            )
    
    db_companies = query.order_by(CompanyDB.match_rate.desc()).all()

    # If new user has registered company name but no DB company row yet, create it on-demand
    if current_user and not db_companies and current_user.company_name:
        new_comp = CompanyDB(
            id=f"c-{uuid4().hex[:6]}",
            user_id=current_user.id,
            name=current_user.company_name,
            industry="Financial Services & Commerce",
            match_rate=100,
            total_records=0,
            anomaly_status="NONE",
            match_status="MATCHED",
            invoice_amount=0.0,
            razorpay_amount=0.0,
            bank_amount=0.0,
            created_at=datetime.now(timezone.utc),
        )
        db.add(new_comp)
        db.commit()
        db.refresh(new_comp)
        db_companies = [new_comp]

    results: List[CompanyModel] = []
    
    for c in db_companies:
        results.append(
            CompanyModel(
                id=c.id,
                name=c.name,
                industry=c.industry or "Financial Services & Commerce",
                match_rate=c.match_rate or 0,
                total_records=c.total_records or 0,
                anomaly_status=c.anomaly_status or "NONE",
                match_status=c.match_status or "MATCHED",
                invoice_amount=c.invoice_amount or 0.0,
                razorpay_amount=c.razorpay_amount or 0.0,
                bank_amount=c.bank_amount or 0.0,
                created_at=c.created_at,
            )
        )
    return ApiResponse(success=True, data=results)


@router.post("", response_model=ApiResponse[CompanyModel], status_code=status.HTTP_201_CREATED)
async def create_company(
    req: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: Optional[UserDB] = Depends(get_current_user_optional),
):
    """Create a new client entity or company workspace."""
    clean_name = req.name.strip()
    existing = db.query(CompanyDB).filter(CompanyDB.name == clean_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Company '{clean_name}' already exists.",
        )

    company_id = f"c-{uuid4().hex[:6]}"
    new_comp = CompanyDB(
        id=company_id,
        user_id=current_user.id if current_user else None,
        name=clean_name,
        industry=req.industry or "Technology & Services",
        match_rate=100,
        total_records=0,
        anomaly_status="NONE",
        match_status="MATCHED",
        invoice_amount=0.0,
        razorpay_amount=0.0,
        bank_amount=0.0,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_comp)
    db.commit()
    db.refresh(new_comp)

    return ApiResponse(
        success=True,
        data=CompanyModel(
            id=new_comp.id,
            name=new_comp.name,
            industry=new_comp.industry,
            match_rate=new_comp.match_rate,
            total_records=new_comp.total_records,
            anomaly_status=new_comp.anomaly_status,
            match_status=new_comp.match_status,
            invoice_amount=new_comp.invoice_amount,
            razorpay_amount=new_comp.razorpay_amount,
            bank_amount=new_comp.bank_amount,
            created_at=new_comp.created_at,
        ),
    )
