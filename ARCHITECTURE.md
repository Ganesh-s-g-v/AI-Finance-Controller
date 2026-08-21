# AI Finance Controller — Architecture Document

> **Version**: 1.0 (MVP)
> **Last Updated**: 2026-08-21
> **Status**: LOCKED — Changes require explicit approval

---

## 1. Product Overview

An AI-assisted reconciliation copilot for Chartered Accountants that:

- Imports financial CSVs (Bank Statement, Razorpay Settlement, Invoice)
- Normalizes records into a unified model
- Reconciles transactions using deterministic business rules
- Uses Gemini 2.5 Flash to explain ambiguous matches (AI explains, never decides)
- Creates an exception queue for human review
- Exports reconciliation reports

**Core Philosophy**: Deterministic logic decides → AI explains → Humans approve.

---

## 2. Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | React + TypeScript + Vite           |
| Styling    | Tailwind CSS                        |
| Animation  | Framer Motion                       |
| Backend    | FastAPI (Python)                    |
| Database   | Supabase PostgreSQL                 |
| Storage    | Supabase Storage                    |
| AI         | Gemini 2.5 Flash (free tier)        |
| Deploy FE  | Vercel                              |
| Deploy BE  | Render                              |
| VCS        | GitHub (monorepo)                   |
| Auth       | Deferred (no auth for MVP)          |
| Theme      | Dark default + light toggle         |

---

## 3. Monorepo Structure

```
AI Finance Controller/
├── frontend/                    # React + Vite + TypeScript
│   ├── public/
│   ├── src/
│   │   ├── assets/              # Static assets (icons, images)
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # Primitives (Button, Input, Card, Badge, etc.)
│   │   │   ├── layout/          # Header, Sidebar, PageWrapper
│   │   │   ├── upload/          # CSV upload components
│   │   │   ├── reconciliation/  # Match table, detail views
│   │   │   ├── dashboard/       # Dashboard widgets
│   │   │   └── exceptions/      # Exception queue components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions, API client
│   │   ├── pages/               # Route-level page components
│   │   ├── stores/              # State management (Zustand or Context)
│   │   ├── types/               # TypeScript type definitions
│   │   ├── styles/              # Global CSS, theme tokens
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # FastAPI + Python
│   ├── app/
│   │   ├── main.py              # FastAPI app factory
│   │   ├── config.py            # Settings, env vars
│   │   ├── database.py          # Supabase client initialization
│   │   ├── routers/             # Thin API routers
│   │   │   ├── upload.py
│   │   │   ├── reconciliation.py
│   │   │   ├── exceptions.py
│   │   │   └── reports.py
│   │   ├── services/            # Business logic layer
│   │   │   ├── normalizer.py    # CSV parsing + normalization
│   │   │   ├── reconciler.py    # Matching engine
│   │   │   ├── confidence.py    # Confidence scoring
│   │   │   ├── explainer.py     # Gemini AI explanation service
│   │   │   └── reporter.py      # Report generation
│   │   ├── models/              # Pydantic models (request/response)
│   │   │   ├── upload.py
│   │   │   ├── transaction.py
│   │   │   ├── reconciliation.py
│   │   │   └── common.py
│   │   ├── schemas/             # Database table schemas
│   │   │   └── tables.sql
│   │   └── utils/               # Helpers (date parsing, validation)
│   │       ├── date_parser.py
│   │       └── validators.py
│   ├── tests/                   # Unit + integration tests
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── sample_data/                 # Sample CSVs for testing
│   ├── bank_statement.csv
│   ├── razorpay_settlement.csv
│   └── invoices.csv
│
├── ARCHITECTURE.md
├── TASKS.md
├── .gitignore
└── README.md
```

---

## 4. CSV Schemas (LOCKED)

### 4.1 Bank Statement CSV

| Column         | Type    | Required? | Description                          |
| -------------- | ------- | --------- | ------------------------------------ |
| `txn_date`     | Date    | YES       | YYYY-MM-DD or DD-MM-YYYY            |
| `description`  | String  | YES       | Transaction narration/memo           |
| `reference`    | String  | NO        | Bank reference / UTR number          |
| `debit`        | Decimal | YES       | Debit amount (money going out)       |
| `credit`       | Decimal | YES       | Credit amount (money coming in)      |
| `balance`      | Decimal | NO        | Running balance after transaction    |

**IMPORTANT:** Only ONE of `debit` or `credit` will have a value per row. The other is 0 or blank.

**Parsing Rules:**

1. Amount Extraction:
   amount = credit if credit > 0 else abs(debit)
   (Always use the non-zero value from debit/credit)

2. Order ID Extraction:
   - First try to extract from `reference` field (look for "ORD-" pattern)
   - If not found, try to extract from `description` field
   - If not found, set order_id = NULL

3. Date Handling:
   - Accept YYYY-MM-DD and DD-MM-YYYY formats
   - Convert all to YYYY-MM-DD

4. Normalization:
   - Generate new internal UUID for each row (do NOT use txn_date + reference as ID)
   - During normalization, assign: normalized.id = UUID()

5. Validation:
   - Allow duplicate reference values.
   - Warn if debit AND credit both contain non-zero values (data quality issue)
   - Accept if either debit OR credit is 0 or blank

**Sample Bank Statement CSV:**

```csv
txn_date,description,reference,debit,credit,balance
2026-08-15,Settlement payment,ORD-001,0.00,9705.00,50000.00
2026-08-16,Customer deposit,ORD-002,0.00,14557.50,64557.50
2026-08-17,Refund processed,,4852.50,0.00,59705.00
2026-08-18,Unknown deposit,,0.00,7764.00,67469.00
2026-08-20,Invoice INV-005 payment,ORD-005,0.00,7278.75,74747.75
```

**Notes:**
- Only one of `debit` or `credit` has a value per row
- `reference` can be empty (nullable)
- `balance` can be empty (nullable) — it's just for context

### 4.2 Razorpay Settlement CSV

| Column         | Type    | Description                              |
| -------------- | ------- | ---------------------------------------- |
| `settlement_id`| String  | Razorpay settlement identifier           |
| `order_id`     | String  | Razorpay order ID                        |
| `payment_id`   | String  | Razorpay payment ID                      |
| `settlement_date`| Date  | YYYY-MM-DD or DD-MM-YYYY                |
| `gross_amount` | Decimal | Total payment amount                     |
| `fee`          | Decimal | Razorpay processing fee                  |
| `tax`          | Decimal | Tax on fee (GST)                         |
| `net_amount`   | Decimal | Amount settled to bank                   |

**Validation Rules:**
- `net_amount` MUST equal `gross_amount - fee - tax` within ₹0.01
- If validation fails → create EXCEPTION (deterministic, no AI involved)
- Reject uploads containing duplicate `settlement_id` values
- Accept YYYY-MM-DD and DD-MM-YYYY date formats only

### 4.3 Invoice CSV

| Column          | Type    | Description                           |
| --------------- | ------- | ------------------------------------- |
| `invoice_id`    | String  | Unique invoice identifier             |
| `order_id`      | String  | Business order ID                     |
| `customer_name` | String  | Customer name                         |
| `issue_date`    | Date    | YYYY-MM-DD or DD-MM-YYYY             |
| `amount`        | Decimal | Subtotal before GST                   |
| `gst_amount`    | Decimal | GST amount                            |
| `total_amount`  | Decimal | amount + gst_amount                   |
| `status`        | Enum    | PAID \| PENDING \| CANCELLED          |

**Validation Rules:**
- `total_amount` MUST equal `amount + gst_amount`
- Only `PAID` invoices are eligible for reconciliation in V1
- Reject uploads containing duplicate `invoice_id` values
- Accept YYYY-MM-DD and DD-MM-YYYY date formats only

---

## 5. Database Schema

### 5.1 `upload_sessions`

Tracks each CSV upload batch.

| Column          | Type      | Constraints            |
| --------------- | --------- | ---------------------- |
| `id`            | UUID      | PK, auto-generated     |
| `source_type`   | ENUM      | BANK, RAZORPAY, INVOICE|
| `file_name`     | TEXT      | NOT NULL               |
| `record_count`  | INT       | NOT NULL               |
| `status`        | ENUM      | PENDING, PROCESSED, ERROR |
| `error_details` | JSONB     | nullable               |
| `uploaded_at`   | TIMESTAMPTZ | DEFAULT now()        |

### 5.2 `bank_transactions`

| Column          | Type      | Constraints            |
| --------------- | --------- | ---------------------- |
| `id`            | UUID      | PK, auto-generated     |
| `upload_session_id` | UUID  | FK → upload_sessions   |
| `row_number`    | INT       | NOT NULL               |
| `txn_date`      | DATE      | NOT NULL               |
| `description`   | TEXT      | NOT NULL               |
| `reference`     | TEXT      | nullable               |
| `extracted_order_id` | TEXT | nullable               |
| `debit`         | DECIMAL(15,2) | NOT NULL, DEFAULT 0  |
| `credit`        | DECIMAL(15,2) | NOT NULL, DEFAULT 0  |
| `balance`       | DECIMAL(15,2) | nullable             |
| `amount`        | DECIMAL(15,2) | NOT NULL (computed: credit if credit > 0 else abs(debit)) |
| `is_reconciled` | BOOLEAN   | DEFAULT false          |
| `created_at`    | TIMESTAMPTZ | DEFAULT now()        |

### 5.3 `razorpay_settlements`

| Column            | Type      | Constraints            |
| ----------------- | --------- | ---------------------- |
| `id`              | UUID      | PK, auto-generated     |
| `upload_session_id` | UUID    | FK → upload_sessions   |
| `row_number`      | INT       | NOT NULL               |
| `settlement_id`   | TEXT      | UNIQUE, NOT NULL       |
| `order_id`        | TEXT      | NOT NULL               |
| `payment_id`      | TEXT      |                        |
| `settlement_date` | DATE      | NOT NULL               |
| `gross_amount`    | DECIMAL(15,2) | NOT NULL           |
| `fee`             | DECIMAL(15,2) | NOT NULL           |
| `tax`             | DECIMAL(15,2) | NOT NULL           |
| `net_amount`      | DECIMAL(15,2) | NOT NULL           |
| `fee_validated`   | BOOLEAN   | NOT NULL               |
| `is_reconciled`   | BOOLEAN   | DEFAULT false          |
| `created_at`      | TIMESTAMPTZ | DEFAULT now()        |

### 5.4 `invoices`

| Column          | Type      | Constraints            |
| --------------- | --------- | ---------------------- |
| `id`            | UUID      | PK, auto-generated     |
| `upload_session_id` | UUID  | FK → upload_sessions   |
| `row_number`    | INT       | NOT NULL               |
| `invoice_id`    | TEXT      | UNIQUE, NOT NULL       |
| `order_id`      | TEXT      | NOT NULL               |
| `customer_name` | TEXT      |                        |
| `issue_date`    | DATE      | NOT NULL               |
| `amount`        | DECIMAL(15,2) | NOT NULL           |
| `gst_amount`    | DECIMAL(15,2) | NOT NULL           |
| `total_amount`  | DECIMAL(15,2) | NOT NULL           |
| `status`        | VARCHAR(20) | NOT NULL             |
| `is_reconciled` | BOOLEAN   | DEFAULT false          |
| `created_at`    | TIMESTAMPTZ | DEFAULT now()        |

### 5.5 `reconciliation_sessions`

| Column          | Type      | Constraints            |
| --------------- | --------- | ---------------------- |
| `id`            | UUID      | PK, auto-generated     |
| `bank_upload_id`| UUID      | FK → upload_sessions   |
| `razorpay_upload_id` | UUID | FK → upload_sessions   |
| `invoice_upload_id`  | UUID | FK → upload_sessions   |
| `total_records` | INT       |                        |
| `matched_count` | INT       | DEFAULT 0              |
| `review_count`  | INT       | DEFAULT 0              |
| `exception_count`| INT     | DEFAULT 0              |
| `status`        | ENUM      | IN_PROGRESS, COMPLETED |
| `started_at`    | TIMESTAMPTZ | DEFAULT now()        |
| `completed_at`  | TIMESTAMPTZ |                      |

### 5.6 `reconciliation_results`

| Column            | Type      | Constraints             |
| ----------------- | --------- | ----------------------- |
| `id`              | UUID      | PK, auto-generated      |
| `session_id`      | UUID      | FK → reconciliation_sessions |
| `invoice_id`      | UUID      | FK → invoices, nullable |
| `settlement_id`   | UUID      | FK → razorpay_settlements, nullable |
| `bank_txn_id`     | UUID      | FK → bank_transactions, nullable |
| `match_type`      | ENUM      | FULL, PARTIAL, NONE     |
| `confidence_score`| INT       | 0–100                   |
| `status`          | ENUM      | MATCHED, REVIEW_REQUIRED, EXCEPTION |
| `matched_on`      | JSONB     | Which fields matched    |
| `amount_difference`| DECIMAL(15,2) | nullable            |
| `ai_explanation`  | TEXT      | Gemini explanation       |
| `reviewed_by`     | TEXT      | nullable (future auth)  |
| `reviewed_at`     | TIMESTAMPTZ | nullable              |
| `review_action`   | ENUM      | APPROVED, REJECTED, nullable |
| `created_at`      | TIMESTAMPTZ | DEFAULT now()         |

### 5.7 Normalization Process

During CSV parsing, transform raw rows into normalized format:

**Bank Statement Normalization:**
```python
normalized_bank = {
    "id": UUID(),  # Generate new UUID, don't use CSV data
    "row_number": csv_row_index,
    "source": "bank",
    "txn_date": parse_date(raw_row.txn_date),  # Convert to YYYY-MM-DD
    "description": raw_row.description.strip(),
    "reference": raw_row.reference.strip() if raw_row.reference else None,
    "extracted_order_id": extract_order_id(raw_row.reference, raw_row.description),
    "amount": raw_row.credit if raw_row.credit > 0 else abs(raw_row.debit),
    "balance": raw_row.balance,
    "debit": raw_row.debit,
    "credit": raw_row.credit,
}
```

**Razorpay Settlement Normalization:**
```python
normalized_settlement = {
    "id": UUID(),  # Generate new UUID
    "row_number": csv_row_index,
    "source": "razorpay",
    "settlement_id": raw_row.settlement_id,
    "order_id": raw_row.order_id.strip(),
    "payment_id": raw_row.payment_id,
    "settlement_date": parse_date(raw_row.settlement_date),
    "gross_amount": Decimal(raw_row.gross_amount),
    "fee": Decimal(raw_row.fee),
    "tax": Decimal(raw_row.tax),
    "net_amount": Decimal(raw_row.net_amount),
    # Validate: abs(gross_amount - fee - tax - net_amount) < 0.01
}
```

**Invoice Normalization:**
```python
normalized_invoice = {
    "id": UUID(),  # Generate new UUID
    "row_number": csv_row_index,
    "source": "invoice",
    "invoice_id": raw_row.invoice_id.strip(),
    "order_id": raw_row.order_id.strip() if raw_row.order_id else None,
    "customer_name": raw_row.customer_name.strip(),
    "issue_date": parse_date(raw_row.issue_date),
    "amount": Decimal(raw_row.amount),
    "gst_amount": Decimal(raw_row.gst_amount),
    "total_amount": Decimal(raw_row.total_amount),
    "status": raw_row.status,
    # Validate: abs(amount + gst_amount - total_amount) < 0.01
}
```

---

## 6. Reconciliation Engine (LOCKED)

### 6.1 Three-Source Reconciliation Sequence

```
Step 1: Invoice ↔ Razorpay (via order_id)
Step 2: Razorpay ↔ Bank (via order_id + net_amount + settlement_date)
Step 3: Produce one reconciliation record linking all three
```

Razorpay is the **bridge** between gross invoice value and net bank deposit.
Do NOT match Bank directly to Invoice unless no Razorpay record exists (exception case).

### 6.2 Matching Priority

Matching happens in this order:

**Step 1: Invoice ↔ Razorpay Settlement**
- Match by: order_id (primary)
- Amount: total_amount (invoice) ≈ gross_amount (settlement)
- Date: issue_date (invoice) ≈ settlement_date (settlement)
- Confidence contribution: See Section 6.5

**Step 2: Razorpay Settlement ↔ Bank Transaction**
- Match by: order_id (extracted from bank reference/description)
- Amount: net_amount (settlement) ≈ amount (bank, calculated as credit if credit > 0 else abs(debit))
- Date: settlement_date ≈ txn_date
- Confidence contribution: See Section 6.5

**Step 3: Produce Reconciliation Record**
- Link all three: Invoice → Settlement → Bank
- One record per successful match
- Unmatched records become exceptions

### 6.3 Amount Tolerance

- Difference ≤ ₹1.00 → Treat as amount match
- Difference > ₹1.00 → Partial match or exception (use confidence scoring)
- Tolerance is FIXED for V1 (not user-configurable)

### 6.4 Confidence Scoring

| Score Range | Status           | Action                          |
| ----------- | ---------------- | ------------------------------- |
| ≥ 80        | MATCHED          | Auto-matched, no review needed  |
| 60–79       | REVIEW_REQUIRED  | Gemini explains, human reviews  |
| < 60        | EXCEPTION        | Queued for manual resolution    |

### 6.5 Confidence Calculation Rules

```
Base Score: 0

+40  order_id exact match (Invoice ↔ Razorpay)
+25  amount match (within ₹1 tolerance)
+15  date match (same day)
+10  date proximity (within 3 days)
+10  reference/UTR match (Razorpay ↔ Bank)

Deductions:
-20  amount mismatch > ₹1
-10  date mismatch > 3 days
-30  order_id missing from one source
```

### 6.6 Fee Validation (Pre-Reconciliation)

Before matching, validate every Razorpay settlement record:

```
expected_net = gross_amount - fee - tax
if abs(expected_net - csv_net_amount) > 0.01:
    → Create EXCEPTION (fee_validation_failed)
    → Record is NOT eligible for reconciliation
```

This is deterministic business logic — AI is NOT involved.

### 6.7 One-to-One Match Constraint

Each transaction can belong to only ONE successful match.
Once matched, a record is marked `is_reconciled = true` and excluded from further matching.

---

## 7. AI Explanation Layer

### 7.1 When AI is Invoked

- **REVIEW_REQUIRED** (confidence 60–79): Gemini explains why the match is uncertain
- **EXCEPTION** (confidence < 60): Gemini describes what data is missing or conflicting

### 7.2 What AI Receives

```json
{
  "invoice": { ... },
  "settlement": { ... },
  "bank_transaction": { ... },
  "confidence_score": 72,
  "matched_fields": ["order_id"],
  "mismatched_fields": ["amount"],
  "amount_difference": 15.50
}
```

### 7.3 What AI Returns

A natural language explanation (max 200 words).

### 7.4 What AI CANNOT Do

- Modify confidence scores
- Change match status
- Alter financial records
- Make reconciliation decisions

---

## 8. API Contracts

### 8.1 Upload

```
POST /api/v1/upload
Content-Type: multipart/form-data
Body: { file: File, source_type: "bank" | "razorpay" | "invoice" }

Response 200:
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "source_type": "bank",
    "record_count": 150,
    "validation_errors": [
      {
        "row": 23,
        "field": "debit",
        "error": "Expected decimal, got 'abc'"
      }
    ],
    "duplicate_count": 0
  }
}

Response 422:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": [...]
  }
}
```

### 8.2 Reconciliation

```
POST /api/v1/reconcile
Body: {
  "bank_upload_id": "uuid",
  "razorpay_upload_id": "uuid",
  "invoice_upload_id": "uuid"
}

Response 200:
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "total_records": 150,
    "matched": 120,
    "review_required": 18,
    "exceptions": 12,
    "processing_time_ms": 2340
  }
}
```

### 8.3 Get Reconciliation Results

```
GET /api/v1/reconcile/{session_id}/results?status=REVIEW_REQUIRED&page=1&limit=20

Response 200:
{
  "success": true,
  "data": {
    "results": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 18,
      "total_pages": 1
    }
  }
}
```

### 8.4 Get Transaction Detail

```
GET /api/v1/reconcile/{session_id}/results/{result_id}

Response 200:
{
  "success": true,
  "data": {
    "result": { ... },
    "invoice": { ... },
    "settlement": { ... },
    "bank_transaction": { ... },
    "ai_explanation": "..."
  }
}
```

### 8.5 Review Action

```
POST /api/v1/reconcile/{session_id}/results/{result_id}/review
Body: {
  "action": "APPROVED" | "REJECTED",
  "notes": "Optional reviewer notes"
}

Response 200:
{
  "success": true,
  "data": {
    "result_id": "uuid",
    "status": "MATCHED",
    "reviewed_at": "..."
  }
}
```

**Review Rules (LOCKED)**

APPROVED:
- review_action = APPROVED
- status = MATCHED
- confidence_score remains unchanged

REJECTED:
- review_action = REJECTED
- status = EXCEPTION
- confidence_score remains unchanged

The original confidence score is never overwritten.
Human review is stored separately for auditability.

### 8.6 Dashboard Summary

```
GET /api/v1/dashboard/summary

Response 200:
{
  "success": true,
  "data": {
    "total_transactions": 450,
    "matched": 360,
    "review_required": 54,
    "exceptions": 36,
    "match_rate": 80.0,
    "total_amount_reconciled": 1250000.00,
    "pending_amount": 312500.00,
    "recent_sessions": [...]
  }
}
```

### 8.7 Export Report

```
GET /api/v1/reports/{session_id}/export?format=csv

Response 200: File download (CSV or PDF)
```

---

## 9. Frontend Pages

| Route                         | Page                      | Description                                        |
| ----------------------------- | ------------------------- | -------------------------------------------------- |
| `/`                           | Dashboard                 | Summary stats, charts, recent sessions             |
| `/upload`                     | Upload                    | Drag-and-drop CSV upload for all 3 source types    |
| `/reconcile`                  | Reconciliation            | Trigger reconciliation, view results table         |
| `/reconcile/:sessionId`       | Session Results           | Filtered results with search and status tabs       |
| `/reconcile/:sessionId/:id`   | Transaction Detail        | Side-by-side comparison + AI explanation           |
| `/exceptions`                 | Exception Queue           | Filterable list of exceptions, approve/reject      |

---

## 10. Design System

### 10.1 Spacing

8px grid system: `8, 16, 24, 32, 40, 48, 56, 64`

### 10.2 Typography

- Font: Inter (Google Fonts)
- Scale: 12px, 14px, 16px, 20px, 24px, 32px, 40px

### 10.3 Colors (Dark Theme — Default)

| Token               | Value       | Usage                     |
| -------------------- | ----------- | ------------------------- |
| `--bg-primary`       | #0A0A0F     | Page background           |
| `--bg-secondary`     | #12121A     | Card background           |
| `--bg-tertiary`      | #1A1A27     | Elevated surfaces         |
| `--border`           | #2A2A3C     | Borders and dividers      |
| `--text-primary`     | #F0F0F5     | Primary text              |
| `--text-secondary`   | #8B8BA3     | Secondary text            |
| `--text-muted`       | #5C5C73     | Muted/disabled text       |
| `--accent`           | #6366F1     | Primary accent (indigo)   |
| `--accent-hover`     | #818CF8     | Hover state               |
| `--success`          | #22C55E     | Matched status            |
| `--warning`          | #F59E0B     | Review required           |
| `--error`            | #EF4444     | Exception/error           |
| `--info`             | #3B82F6     | Informational             |

### 10.4 Colors (Light Theme)

| Token               | Value       |
| -------------------- | ----------- |
| `--bg-primary`       | #FAFAFA     |
| `--bg-secondary`     | #FFFFFF     |
| `--bg-tertiary`      | #F5F5F7     |
| `--border`           | #E5E5EA     |
| `--text-primary`     | #1A1A2E     |
| `--text-secondary`   | #6B6B80     |
| `--text-muted`       | #9B9BB0     |

### 10.5 Component Library

Reusable primitives:

- `Button` (primary, secondary, ghost, danger)
- `Input` (text, search)
- `Card`
- `Badge` (matched, review, exception)
- `Table` (sortable, paginated)
- `Modal`
- `Dropdown`
- `FileUpload` (drag-and-drop)
- `Tabs`
- `Toast/Notification`
- `Skeleton` (loading states)
- `EmptyState`
- `ThemeToggle`

### 10.6 Animations

- All transitions: 180–300ms with ease-out
- Page transitions: fade + slide
- Card hover: subtle scale(1.01) + shadow
- Status badges: pulse on new items
- Upload: progress animation
- Charts: staggered entry

---

## 11. Engineering Constraints

1. Business logic is completely independent of AI
2. AI cannot modify financial records
3. Every decision is reproducible from database records
4. One transaction → one match only
5. No hardcoded business data in frontend
6. CSV files are the only data source for V1
7. Every API returns typed success/error JSON
8. Routers stay thin — logic in services
9. Modular, readable, production-grade code
10. All amounts stored as DECIMAL(15,2)
