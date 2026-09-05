# AI Finance Controller — Task Tracker

> **Last Updated**: 2026-08-21
> **Current Phase**: Phase 2 — Supabase Setup ⬜ (Phase 1 Scaffolding ✅)
> **Timeline**: 2 weeks (Razorpay Buildathon)

---

## Phase Overview

| Phase | Name                         | Status      | Est. Time |
| ----- | ---------------------------- | ----------- | --------- |
| 0     | Planning & Architecture      | ✅ COMPLETE | Day 1     |
| 1     | Project Scaffolding          | ✅ COMPLETE | Day 1     |
| 2     | Supabase Setup               | ⬜ PENDING  | Day 2     |
| 3     | Design System & UI Shell     | ⬜ PENDING  | Day 2–3   |
| 4     | CSV Upload Pipeline          | ⬜ PENDING  | Day 3–4   |
| 5     | Normalizer Service           | ⬜ PENDING  | Day 4–5   |
| 6     | Reconciliation Engine        | ⬜ PENDING  | Day 5–7   |
| 7     | AI Explanation Layer         | ⬜ PENDING  | Day 7–8   |
| 8     | Dashboard & Analytics        | ⬜ PENDING  | Day 8–9   |
| 9     | Exception Queue & Review     | ⬜ PENDING  | Day 9–10  |
| 10    | Export & Reports             | ⬜ PENDING  | Day 10–11 |
| 11    | Polish, Testing & Bug Fixes  | ⬜ PENDING  | Day 11–12 |
| 12    | Deployment                   | ⬜ PENDING  | Day 13–14 |

---

## Phase 0 — Planning & Architecture ✅

- [x] Define product requirements
- [x] Lock CSV schemas (Bank, Razorpay, Invoice)
- [x] Lock reconciliation rules (three-source, sequence, tolerance)
- [x] Lock fee validation rules
- [x] Lock confidence scoring algorithm
- [x] Lock AI boundaries (explain only, never decide)
- [x] Define database schema
- [x] Define API contracts
- [x] Define frontend routes and pages
- [x] Define design system (colors, typography, spacing)
- [x] Create ARCHITECTURE.md (Draft)
- [x] Create TASKS.md (Draft)
- [x] ARCHITECTURE.md Amendment: Apply 7 corrections (CSV schemas, matching logic, normalization pseudocode)
- [x] ARCHITECTURE.md finalized and locked

---

## Phase 1 — Project Scaffolding ✅

**Timeline:** Day 1 (Frontend and Backend parallelized)

### Initial Setup (Sequential)
- [x] Initialize Git repository
- [x] Create `.gitignore`
- [x] Create `.env.example` files for both frontend and backend

### Frontend Scaffolding (Parallel Track A)
- [x] Scaffold frontend (Vite + React + TypeScript)
- [x] Install frontend dependencies (Tailwind CSS, Framer Motion, React Router, Zustand, Axios)
- [x] Configure Tailwind CSS with design tokens
- [x] Verify dev server starts cleanly: `npm run dev`

### Backend Scaffolding (Parallel Track B)
- [x] Scaffold backend (FastAPI project structure)
- [x] Install backend dependencies (fastapi, uvicorn, supabase-py, python-multipart, google-generativeai, pydantic)
- [x] Verify dev server starts cleanly: `uvicorn app.main:app --reload`

### Shared Resources
- [x] Create sample CSV test data (bank, razorpay, invoice)
- [x] Create `README.md` with setup instructions for both frontend and backend

**Deliverable:** Both frontend and backend dev servers running locally.

---

## Phase 2 — Supabase Setup

- [ ] Guide user through Supabase project creation
- [ ] Create database tables (SQL migration)
- [ ] Set up Supabase Storage bucket for CSV files
- [ ] Configure backend Supabase client
- [ ] Test database connection
- [ ] Configure RLS policies (basic, no auth)

---

## Phase 3 — Design System & UI Shell ✅

- [x] Set up global CSS variables and theme tokens
- [x] Implement dark/light theme toggle with persistence
- [x] Build UI primitives: Button, Input, Card, Badge, Table, Modal
- [x] Build layout components: Header, Sidebar, PageWrapper, PillNavigation
- [x] Build skeleton/loading states
- [x] Build empty states
- [x] Build toast notification system
- [x] Verify responsive layout across breakpoints

---

## Phase 4 — CSV Upload Pipeline ✅

**Backend:**
- [x] `POST /api/v1/upload` endpoint
- [x] CSV file validation (size, format, encoding)
- [x] Column header validation per source type
- [x] In-memory session store for uploaded documents
- [x] Create upload_session record
- [x] Return validation result with error details

**Frontend:**
- [x] Drag-and-drop file upload component
- [x] Source type selector (Bank / Razorpay / Invoice)
- [x] Upload progress animation
- [x] Validation error display
- [x] Upload success confirmation with record count

---

## Phase 5 — Normalizer Service ✅

**Backend:**
- [x] Date parser utility (YYYY-MM-DD and DD-MM-YYYY)
- [x] Bank statement normalizer
  - [x] Parse CSV columns
  - [x] Extract order_id from reference AND description
  - [x] Detect and reject duplicates
  - [x] Store into normalized in-memory collections
- [x] Razorpay settlement normalizer
  - [x] Parse CSV columns
  - [x] Fee validation: net_amount == gross_amount - fee - tax (±₹0.01)
  - [x] Detect and reject duplicate settlement_ids
  - [x] Store into normalized in-memory collections
- [x] Invoice normalizer
  - [x] Parse CSV columns
  - [x] Filter only PAID invoices for reconciliation
  - [x] Detect and reject duplicate invoice_ids
  - [x] Store into normalized in-memory collections
- [x] Update upload_session status after processing
- [x] Automated tests for each normalizer

---

## Phase 6 — Reconciliation Engine ✅

**Backend:**
- [x] `POST /api/v1/reconcile` endpoint
- [x] Create reconciliation_session record
- [x] Step 1: Match Invoice ↔ Razorpay (order_id primary)
- [x] Step 2: Match Razorpay ↔ Bank (order_id + net_amount + settlement_date)
- [x] Step 3: Produce reconciliation_result linking all three
- [x] Confidence scoring engine
  - [x] order_id match (+40)
  - [x] Amount match within ₹1 (+25)
  - [x] Date match same day (+15)
  - [x] Date proximity ≤ 3 days (+10)
  - [x] Reference/UTR match (+10)
  - [x] Amount mismatch > ₹1 (-20)
  - [x] Date mismatch > 3 days (-10)
  - [x] order_id missing (-30)
- [x] Status assignment: MATCHED (≥80), REVIEW_REQUIRED (60–79), EXCEPTION (<60)
- [x] Handle unmatched records (create EXCEPTION entries)
- [x] Update session summary counts
- [x] `GET /api/v1/reconcile/{session_id}/results` with pagination and filtering

**Frontend:**
- [x] Reconciliation trigger workspace
- [x] Processing animation
- [x] Results summary cards (matched, review, exception counts)
- [x] Results table with status tabs and search
- [x] Status badge components

---

## Phase 7 — AI Explanation Layer ⬜

**Backend:**
- [ ] Gemini 2.5 Flash client service
- [ ] Explanation prompt template
- [ ] Generate explanations for REVIEW_REQUIRED matches
- [ ] Generate explanations for EXCEPTION matches
- [ ] Store explanations in reconciliation_results.ai_explanation
- [ ] Rate limiting and error handling for Gemini API

**Frontend:**
- [x] Transaction detail view (side-by-side comparison in TransactionDrawer)
- [x] AI explanation display card
- [x] Visual diff highlighting for mismatched fields

---

## Phase 8 — Dashboard & Analytics ✅

**Backend:**
- [x] `GET /api/v1/dashboard/summary` endpoint
- [x] Aggregate statistics calculation

**Frontend:**
- [x] Dashboard page layout
- [x] Summary stat cards (total, matched, review, exception)
- [x] Match rate percentage with visual indicator
- [x] Amount reconciled vs pending
- [x] Recent reconciliation sessions list
- [x] Interactive card deck animation

---

## Phase 9 — Exception Queue & Review ✅

**Backend:**
- [x] `GET /api/v1/exceptions` endpoint (filtered, paginated)
- [x] `POST /api/v1/reconcile/{session_id}/results/{id}/review` endpoint
- [x] Review action processing (APPROVED → update status, REJECTED → mark)

**Frontend:**
- [x] Exception queue and review view
- [x] Context drawer with approve / reject actions
- [x] Live UI update on review actions

---

## Phase 10 — Export & Reports

**Backend:**
- [ ] `GET /api/v1/reports/{session_id}/export?format=csv` endpoint
- [ ] CSV report generator (all results with status)
- [ ] Summary statistics in export

**Frontend:**
- [ ] Export button on reconciliation results page
- [ ] Format selector (CSV)
- [ ] Download trigger

---

## Phase 11 — Polish, Testing & Bug Fixes

- [ ] End-to-end flow testing with sample data
- [ ] Error handling review (all API endpoints)
- [ ] Loading states for all async operations
- [ ] Empty states for all pages
- [ ] Responsive design verification
- [ ] Animation performance audit
- [ ] Accessibility audit (contrast, keyboard navigation)
- [ ] Console error cleanup
- [ ] Code cleanup and comments

---

## Phase 12 — Deployment

- [ ] Prepare frontend for Vercel deployment
- [ ] Prepare backend for Render deployment
- [ ] Set up environment variables in production
- [ ] Configure CORS for production domains
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Render
- [ ] Verify production end-to-end
- [ ] Create demo walkthrough / README
- [ ] Final TASKS.md update

---

## Notes

- Each phase MUST be completed and approved before starting the next
- ARCHITECTURE.md is the source of truth for all technical decisions
- Any architectural changes require explicit user approval
