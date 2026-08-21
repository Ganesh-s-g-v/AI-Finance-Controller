-- ==============================================================================
-- AI FINANCE CONTROLLER — DATABASE SCHEMA
-- Target: Supabase PostgreSQL
-- Version: 1.0 (LOCKED)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE source_type_enum AS ENUM ('BANK', 'RAZORPAY', 'INVOICE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status_enum AS ENUM ('PENDING', 'PROCESSED', 'ERROR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recon_session_status_enum AS ENUM ('IN_PROGRESS', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_type_enum AS ENUM ('FULL', 'PARTIAL', 'NONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_status_enum AS ENUM ('MATCHED', 'REVIEW_REQUIRED', 'EXCEPTION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_action_enum AS ENUM ('APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE: upload_sessions
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type source_type_enum NOT NULL,
    file_name TEXT NOT NULL,
    record_count INT NOT NULL,
    status session_status_enum NOT NULL DEFAULT 'PENDING',
    error_details JSONB,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLE: bank_transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    txn_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference TEXT,
    extracted_order_id TEXT,
    debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    balance DECIMAL(15,2),
    amount DECIMAL(15,2) NOT NULL,
    is_reconciled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLE: razorpay_settlements
CREATE TABLE IF NOT EXISTS razorpay_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    settlement_id TEXT UNIQUE NOT NULL,
    order_id TEXT NOT NULL,
    payment_id TEXT,
    settlement_date DATE NOT NULL,
    gross_amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) NOT NULL,
    tax DECIMAL(15,2) NOT NULL,
    net_amount DECIMAL(15,2) NOT NULL,
    fee_validated BOOLEAN NOT NULL,
    is_reconciled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLE: invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    invoice_id TEXT UNIQUE NOT NULL,
    order_id TEXT NOT NULL,
    customer_name TEXT,
    issue_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    gst_amount DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    is_reconciled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABLE: reconciliation_sessions
CREATE TABLE IF NOT EXISTS reconciliation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_upload_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL,
    razorpay_upload_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL,
    invoice_upload_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL,
    total_records INT NOT NULL DEFAULT 0,
    matched_count INT NOT NULL DEFAULT 0,
    review_count INT NOT NULL DEFAULT 0,
    exception_count INT NOT NULL DEFAULT 0,
    status recon_session_status_enum NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- 7. TABLE: reconciliation_results
CREATE TABLE IF NOT EXISTS reconciliation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES reconciliation_sessions(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    settlement_id UUID REFERENCES razorpay_settlements(id) ON DELETE SET NULL,
    bank_txn_id UUID REFERENCES bank_transactions(id) ON DELETE SET NULL,
    match_type match_type_enum NOT NULL,
    confidence_score INT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    status match_status_enum NOT NULL,
    matched_on JSONB,
    amount_difference DECIMAL(15,2),
    ai_explanation TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    review_action review_action_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_bank_order_id ON bank_transactions(extracted_order_id);
CREATE INDEX IF NOT EXISTS idx_bank_session ON bank_transactions(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_bank_reconciled ON bank_transactions(is_reconciled);

CREATE INDEX IF NOT EXISTS idx_razorpay_order_id ON razorpay_settlements(order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_session ON razorpay_settlements(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_reconciled ON razorpay_settlements(is_reconciled);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_session ON invoices(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_reconciled ON invoices(is_reconciled);

CREATE INDEX IF NOT EXISTS idx_recon_results_session ON reconciliation_results(session_id);
CREATE INDEX IF NOT EXISTS idx_recon_results_status ON reconciliation_results(status);
