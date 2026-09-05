# AI Finance Controller

> **Fintech Reconciliation Copilot for Chartered Accountants**
> Razorpay Buildathon — Track 4 MVP

An AI-assisted three-way reconciliation system for Chartered Accountants that imports Bank Statements, Razorpay Settlements, and Invoices, performs deterministic matching, and provides natural-language AI explanations for exceptions and review items.

---

## 🎯 Product Philosophy

1. **Deterministic logic decides.**
2. **AI explains.**
3. **Humans approve.**

Gemini is an **explanation engine**, NOT a decision engine.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v3, Framer Motion, Zustand, Axios, Lucide Icons
- **Backend**: FastAPI (Python 3.13), Pydantic v2, Uvicorn
- **Database**: Supabase PostgreSQL + Supabase Storage
- **AI**: Google Gemini 2.5 Flash
- **Deployment**: Vercel (Frontend), Render (Backend)

---

## 📁 Repository Structure

```
AI Finance Controller/
├── frontend/                  # React + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/        # Reusable UI primitives and domain widgets
│   │   ├── lib/               # Axios API client and utility helpers
│   │   ├── models/ & types/   # Strict TypeScript schemas
│   │   ├── styles/            # Tailwind CSS and design tokens
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── backend/                   # FastAPI Python application
│   ├── app/
│   │   ├── main.py            # App factory, CORS, exception handlers
│   │   ├── config.py          # Environment settings (Pydantic BaseSettings)
│   │   ├── database.py        # Supabase client wrapper
│   │   ├── models/            # Pydantic v2 request/response models
│   │   ├── routers/           # Thin REST endpoints (/upload, /reconcile, etc.)
│   │   ├── schemas/           # PostgreSQL migration schemas
│   │   ├── services/          # Pure deterministic business logic
│   │   └── utils/             # Date parsers and validators
│   └── requirements.txt
│
├── sample_data/               # Realistic Indian business reconciliation test datasets
│   ├── bank_statement.csv
│   ├── razorpay_settlement.csv
│   └── invoices.csv
│
├── ARCHITECTURE.md            # System architecture and locked specifications
├── TASKS.md                   # Phased execution checklist (Phase 1–12)
├── AGENT.md                   # AI operational instructions and skill registry
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ (tested on Node v22.13.1)
- **Python**: 3.11+ (tested on Python 3.13.1)
- **Git**

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (optional)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env to add your Supabase URL/Key and Gemini API Key

# Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```

- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start the Vite development server
npm run dev
```

- Web App: [[http://localhost:5173](https://ai-finance-controller-frontend.vercel.app/)](https://ai-finance-controller-frontend.vercel.app/)
check it our here

---

## 📊 Sample Test Datasets

Sample CSVs are provided in `sample_data/`:
1. `bank_statement.csv` — Bank transactions with `debit`/`credit` split and extracted `order_id` in reference/narration.
2. `razorpay_settlement.csv` — Razorpay payout reports with verified fee calculations (`net_amount = gross_amount - fee - tax`).
3. `invoices.csv` — Standard Indian GST invoices with `PAID`, `PENDING`, and `CANCELLED` statuses.

---

## 📜 Development Protocol

Refer to [TASKS.md](file:///c:/Users/Vardhan/Downloads/AI%20Finance%20Controller/TASKS.md) for current phase status and [ARCHITECTURE.md](file:///c:/Users/Vardhan/Downloads/AI%20Finance%20Controller/ARCHITECTURE.md) for full architectural documentation.
