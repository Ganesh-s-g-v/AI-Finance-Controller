from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.database import get_db, UserDB
from app.models.common import ApiResponse, ErrorDetail
from app.models.user import (
    UserCreate,
    UserLogin,
    UserProfile,
    TokenResponse,
    UserSessionHistoryItem,
    UserRole,
)
from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token
from app import store

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[UserDB]:
    """Extract authenticated user if Authorization header is present."""
    if not authorization:
        return None
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            return None
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
        user_id = payload["sub"]
        user = db.query(UserDB).filter(UserDB.id == user_id).first()
        return user
    except Exception:
        return None


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> UserDB:
    """Enforce authenticated user requirement."""
    user = get_current_user_optional(authorization=authorization, db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing, expired, or invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/register", response_model=ApiResponse[TokenResponse], status_code=status.HTTP_201_CREATED)
async def register_user(req: UserCreate, db: Session = Depends(get_db)):
    """Register a new Controller or Auditor account."""
    existing = db.query(UserDB).filter(UserDB.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    new_user = UserDB(
        id=str(uuid4()),
        email=req.email.lower().strip(),
        name=req.name.strip(),
        hashed_password=hash_password(req.password),
        role=req.role.value if hasattr(req.role, "value") else str(req.role),
        company_name=req.company_name or "Apex Technologies Pvt Ltd",
        avatar_url=req.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={req.name}",
        created_at=datetime.now(timezone.utc),
        last_login=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Automatically create user's personal company workspace if company_name provided
    from app.database import CompanyDB
    user_company = db.query(CompanyDB).filter(CompanyDB.name == new_user.company_name).first()
    if not user_company:
        comp_record = CompanyDB(
            id=f"c-{uuid4().hex[:6]}",
            user_id=new_user.id,
            name=new_user.company_name,
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
        db.add(comp_record)
        db.commit()

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})
    profile = UserProfile(
        id=UUID(new_user.id),
        email=new_user.email,
        name=new_user.name,
        role=UserRole(new_user.role) if new_user.role in UserRole.__members__ else UserRole.CONTROLLER,
        company_name=new_user.company_name,
        avatar_url=new_user.avatar_url,
        created_at=new_user.created_at,
        last_login=new_user.last_login,
    )
    return ApiResponse(
        success=True,
        data=TokenResponse(access_token=token, user=profile),
    )


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login_user(req: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive JWT token."""
    user = db.query(UserDB).filter(UserDB.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    profile = UserProfile(
        id=UUID(user.id),
        email=user.email,
        name=user.name,
        role=UserRole(user.role) if user.role in UserRole.__members__ else UserRole.CONTROLLER,
        company_name=user.company_name,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        last_login=user.last_login,
    )
    return ApiResponse(
        success=True,
        data=TokenResponse(access_token=token, user=profile),
    )


@router.get("/me", response_model=ApiResponse[UserProfile])
async def get_me(current_user: UserDB = Depends(get_current_user)):
    """Retrieve the profile and workspace state of the logged-in user."""
    profile = UserProfile(
        id=UUID(current_user.id),
        email=current_user.email,
        name=current_user.name,
        role=UserRole(current_user.role) if current_user.role in UserRole.__members__ else UserRole.CONTROLLER,
        company_name=current_user.company_name,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
    )
    return ApiResponse(success=True, data=profile)


@router.get("/history", response_model=ApiResponse[List[UserSessionHistoryItem]])
async def get_history(current_user: Optional[UserDB] = Depends(get_current_user_optional)):
    """Retrieve historical reconciliation batches for the user to view or resume."""
    user_id = current_user.id if current_user else None
    history = store.get_user_session_history(user_id=user_id)
    return ApiResponse(success=True, data=history)


@router.post("/resume/{session_id}", response_model=ApiResponse[dict])
async def resume_session(session_id: str, current_user: Optional[UserDB] = Depends(get_current_user_optional)):
    """Load a previous reconciliation session back into the active workspace."""
    success = store.restore_session_to_memory(session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reconciliation session '{session_id}' not found.",
        )
    session_data = store.reconciliation_sessions.get(session_id, {})
    return ApiResponse(
        success=True,
        data={
            "session_id": session_id,
            "company_name": session_data.get("company_name", "Apex Technologies Pvt Ltd"),
            "total_records": session_data.get("total_records", 0),
            "matched": session_data.get("matched", 0),
            "review_required": session_data.get("review_required", 0),
            "exceptions": session_data.get("exceptions", 0),
            "status": session_data.get("status", "COMPLETED"),
            "resumed": True,
        },
    )


@router.post("/logout", response_model=ApiResponse[dict])
async def logout_user():
    """Sign out user."""
    return ApiResponse(success=True, data={"message": "Logged out successfully"})
