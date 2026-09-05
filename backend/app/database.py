import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Generator
from uuid import uuid4

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Float,
    DateTime,
    Text,
    Boolean,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger(__name__)

# Determine Database URL: Postgres if provided, otherwise robust SQLite file
DATABASE_URL = settings.DATABASE_URL
if not DATABASE_URL:
    # Use persistent SQLite file with multi-threading enabled
    DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "controller.db"))
    DATABASE_URL = f"sqlite:///{DB_PATH}"

is_sqlite = DATABASE_URL.startswith("sqlite")

engine_args = {}
if is_sqlite:
    engine_args["connect_args"] = {"check_same_thread": False}
    # Pool configuration for high concurrency
    engine = create_engine(DATABASE_URL, **engine_args)
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------------------------------------------------------------------------
# SQLAlchemy ORM Models
# ---------------------------------------------------------------------------

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="CONTROLLER")
    company_name = Column(String(255), default="Acme Global Financials")
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)


class CompanyDB(Base):
    __tablename__ = "companies"

    id = Column(String(100), primary_key=True)
    user_id = Column(String(36), index=True, nullable=True)
    name = Column(String(255), unique=True, nullable=False)
    industry = Column(String(255), default="Financial Services & Commerce")
    match_rate = Column(Integer, default=0)
    total_records = Column(Integer, default=0)
    anomaly_status = Column(String(50), default="NONE")
    match_status = Column(String(50), default="MATCHED")
    invoice_amount = Column(Float, default=0.0)
    razorpay_amount = Column(Float, default=0.0)
    bank_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class UploadSessionDB(Base):
    __tablename__ = "upload_sessions"

    session_id = Column(String(36), primary_key=True)
    user_id = Column(String(36), index=True, nullable=True)
    company_name = Column(String(255), nullable=True)
    source_type = Column(String(50), nullable=False)
    record_count = Column(Integer, default=0)
    validation_errors_json = Column(Text, default="[]")
    duplicate_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ReconciliationSessionDB(Base):
    __tablename__ = "reconciliation_sessions"

    session_id = Column(String(36), primary_key=True)
    user_id = Column(String(36), index=True, nullable=True)
    company_name = Column(String(255), default="Acme Corp")
    bank_upload_id = Column(String(36), nullable=False)
    razorpay_upload_id = Column(String(36), nullable=False)
    invoice_upload_id = Column(String(36), nullable=False)
    total_records = Column(Integer, default=0)
    matched = Column(Integer, default=0)
    review_required = Column(Integer, default=0)
    exceptions = Column(Integer, default=0)
    processing_time_ms = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETED")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ReconciliationResultDB(Base):
    __tablename__ = "reconciliation_results"

    id = Column(String(36), primary_key=True)
    session_id = Column(String(36), index=True, nullable=False)
    invoice_id = Column(String(36), nullable=True)
    settlement_id = Column(String(36), nullable=True)
    bank_txn_id = Column(String(36), nullable=True)
    match_type = Column(String(50), default="FULL")
    confidence_score = Column(Integer, default=100)
    status = Column(String(50), default="MATCHED")
    matched_on_json = Column(Text, nullable=True)
    amount_difference = Column(Float, nullable=True)
    ai_explanation = Column(Text, nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_action = Column(String(50), nullable=True)
    data_json = Column(Text, nullable=True)  # serialised result item
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# Add indexes for speed
Index("ix_rec_results_session_status", ReconciliationResultDB.session_id, ReconciliationResultDB.status)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for yielding database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialise database tables and seed default companies and demo users."""
    from app.utils.security import hash_password
    Base.metadata.create_all(bind=engine)
    
    # Run automatic lightweight column migrations for SQLite if needed
    if is_sqlite:
        with engine.connect() as conn:
            from sqlalchemy import text
            try:
                conn.execute(text("ALTER TABLE companies ADD COLUMN user_id VARCHAR(36)"))
                conn.commit()
            except Exception:
                pass  # column already exists
    
    db = SessionLocal()
    try:
        # Seed Initial Demo Users if not present
        demo_users = [
            {
                "email": "cfo@financecontroller.ai",
                "name": "Sarah Jenkins",
                "password": "cfo123456",
                "role": "CONTROLLER",
                "company_name": "Apex Technologies Pvt Ltd",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
            },
            {
                "email": "auditor@financecontroller.ai",
                "name": "Marcus Vance",
                "password": "audit123456",
                "role": "AUDITOR",
                "company_name": "Zenith Retail Solutions",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            },
            {
                "email": "admin@financecontroller.ai",
                "name": "Alexander Wright",
                "password": "admin123456",
                "role": "ADMIN",
                "company_name": "Acme Global Financials",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
            },
        ]
        
        for u in demo_users:
            existing = db.query(UserDB).filter(UserDB.email == u["email"]).first()
            if not existing:
                user_record = UserDB(
                    email=u["email"],
                    name=u["name"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                    company_name=u["company_name"],
                    avatar_url=u["avatar_url"],
                )
                db.add(user_record)
        
        # Seed Rich Enterprise Companies if none exist
        default_companies = [
            {
                "id": "c-1",
                "name": "Apex Technologies Pvt Ltd",
                "industry": "Enterprise SaaS & Cloud Infra",
                "match_rate": 94,
                "total_records": 55,
                "anomaly_status": "NONE",
                "match_status": "MATCHED",
                "invoice_amount": 128500.00,
                "razorpay_amount": 125930.00,
                "bank_amount": 125930.00,
            },
            {
                "id": "c-2",
                "name": "Zenith Retail Solutions",
                "industry": "Omnichannel Retail & E-Commerce",
                "match_rate": 88,
                "total_records": 48,
                "anomaly_status": "PENDING",
                "match_status": "REVIEW_REQUIRED",
                "invoice_amount": 94600.00,
                "razorpay_amount": 92708.00,
                "bank_amount": 91200.00,
            },
            {
                "id": "c-3",
                "name": "Nexus Global Trading",
                "industry": "Import / Export & Cross-Border",
                "match_rate": 78,
                "total_records": 42,
                "anomaly_status": "PENDING",
                "match_status": "REVIEW_REQUIRED",
                "invoice_amount": 62400.00,
                "razorpay_amount": 61152.00,
                "bank_amount": 58900.00,
            },
            {
                "id": "c-4",
                "name": "Acme Global Financials",
                "industry": "Fintech & Wealth Operations",
                "match_rate": 97,
                "total_records": 60,
                "anomaly_status": "NONE",
                "match_status": "MATCHED",
                "invoice_amount": 154200.00,
                "razorpay_amount": 151116.00,
                "bank_amount": 151116.00,
            },
            {
                "id": "c-5",
                "name": "Initech Systems Corp",
                "industry": "Enterprise Software & IT",
                "match_rate": 100,
                "total_records": 35,
                "anomaly_status": "RESOLVED",
                "match_status": "MATCHED",
                "invoice_amount": 45000.00,
                "razorpay_amount": 44100.00,
                "bank_amount": 44100.00,
            },
            {
                "id": "c-6",
                "name": "Starlight Media & Entertainment",
                "industry": "Digital Streaming & Creator Economy",
                "match_rate": 52,
                "total_records": 28,
                "anomaly_status": "PENDING",
                "match_status": "EXCEPTION",
                "invoice_amount": 38000.00,
                "razorpay_amount": 31200.00,
                "bank_amount": 28400.00,
            },
            {
                "id": "c-7",
                "name": "Quantum AI Labs",
                "industry": "Applied Machine Learning & BioTech",
                "match_rate": 91,
                "total_records": 52,
                "anomaly_status": "NONE",
                "match_status": "MATCHED",
                "invoice_amount": 182000.00,
                "razorpay_amount": 178360.00,
                "bank_amount": 178360.00,
            },
            {
                "id": "c-8",
                "name": "Titan Logistics Fleet",
                "industry": "Freight & Supply Chain",
                "match_rate": 84,
                "total_records": 39,
                "anomaly_status": "PENDING",
                "match_status": "REVIEW_REQUIRED",
                "invoice_amount": 76500.00,
                "razorpay_amount": 74970.00,
                "bank_amount": 73200.00,
            },
        ]
        
        for c in default_companies:
            existing = db.query(CompanyDB).filter(CompanyDB.name == c["name"]).first()
            if not existing:
                comp = CompanyDB(
                    id=c["id"],
                    name=c["name"],
                    industry=c["industry"],
                    match_rate=c["match_rate"],
                    total_records=c["total_records"],
                    anomaly_status=c["anomaly_status"],
                    match_status=c["match_status"],
                    invoice_amount=c["invoice_amount"],
                    razorpay_amount=c["razorpay_amount"],
                    bank_amount=c["bank_amount"],
                )
                db.add(comp)
                
        db.commit()
        logger.info("Database initialised successfully with persistent tables and seed data.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during DB initialization: {e}")
    finally:
        db.close()
