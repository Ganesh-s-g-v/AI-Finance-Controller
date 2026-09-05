# 📊 Sample Financial Datasets for 3-Way Reconciliation Testing

This directory contains pre-configured synthetic corporate financial datasets specifically formatted to test the **AI Finance Controller** 3-way reconciliation engine across Bank Statements, Payment Gateway (Razorpay) Settlements, and ERP Invoices.

---

## 📁 Files Included

| File | Upload Target Slot | Description & Schema |
| :--- | :--- | :--- |
| **`1_bank_statement.csv`** | **Bank Statement** | Date, Description (with Order ID refs), Ref, Debit, Credit, Balance (50 transactions) |
| **`2_gateway_settlements.csv`** | **Payment Gateway** | Settlement ID, Order ID, Payment ID, Date, Gross Amount, Fee (2%), Tax (18% on Fee), Net Amount |
| **`3_invoices.csv`** | **ERP Invoices** | Invoice ID, Order ID, Customer Name, Issue Date, Base Amount, GST 18%, Total Billed Amount, Status |

---

## 🚀 How to Test & Verify in the App

1. **Log in** to FinanceOps (or use the one-click demo credentials `sarah@apex.io` / `ApexFinance2026!`).
2. Navigate to the **Workspace** tab in the top navigation bar.
3. Enter your desired **Target Company / Client Workspace** name (e.g. *Apex Technologies Pvt Ltd* or *Starlight Ventures*).
4. Upload the files into their respective slots:
   - Slot 1: `sample_datasets/1_bank_statement.csv`
   - Slot 2: `sample_datasets/2_gateway_settlements.csv`
   - Slot 3: `sample_datasets/3_invoices.csv`
5. Click **"Run 3-Way Reconciliation"**.
6. The engine will process the 50+ records batch and redirect you to the **Reconciliation** results view.

---

## 🎯 Expected Verification Results

- **Total Transactions Processed**: 55 records
- **Deterministic Match Rate**: ~94%
- **Matches (`MATCHED`)**: 22 records with 0 variance across all 3 ledgers.
- **Review Needed (`REVIEW_REQUIRED`)**: 24 records with timing discrepancies (24h-48h settlement delay) or minor variance under the locked ₹1.00 tolerance.
- **Exceptions (`EXCEPTION`)**: 9 honest exceptions flagged (missing bank deposits, unidentified NEFT credits, uncaptured ERP invoices) with full AI Copilot audit trails.
