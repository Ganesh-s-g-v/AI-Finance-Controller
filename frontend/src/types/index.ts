// Common API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      row?: number;
      field?: string;
      error: string;
    }>;
  };
}

// Source Types
export type SourceType = 'bank' | 'razorpay' | 'invoice';

// Upload Session
export interface UploadSession {
  id: string;
  source_type: SourceType;
  file_name: string;
  record_count: number;
  status: 'PENDING' | 'PROCESSED' | 'ERROR';
  error_details?: Record<string, unknown> | null;
  uploaded_at: string;
}

export interface UploadResponseData {
  session_id: string;
  source_type: SourceType;
  record_count: number;
  validation_errors: Array<{
    row?: number;
    field?: string;
    error: string;
  }>;
  duplicate_count: number;
}

// Normalized Data Models
export interface BankTransaction {
  id: string;
  upload_session_id: string;
  row_number: number;
  txn_date: string;
  description: string;
  reference?: string | null;
  extracted_order_id?: string | null;
  debit: number;
  credit: number;
  balance?: number | null;
  amount: number;
  is_reconciled: boolean;
  created_at: string;
}

export interface RazorpaySettlement {
  id: string;
  upload_session_id: string;
  row_number: number;
  settlement_id: string;
  order_id: string;
  payment_id?: string | null;
  settlement_date: string;
  gross_amount: number;
  fee: number;
  tax: number;
  net_amount: number;
  fee_validated: boolean;
  is_reconciled: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  upload_session_id: string;
  row_number: number;
  invoice_id: string;
  order_id: string;
  customer_name?: string | null;
  issue_date: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  is_reconciled: boolean;
  created_at: string;
}

// Reconciliation Match & Status Types
export type MatchType = 'FULL' | 'PARTIAL' | 'NONE';
export type MatchStatus = 'MATCHED' | 'REVIEW_REQUIRED' | 'EXCEPTION';
export type ReviewAction = 'APPROVED' | 'REJECTED';

// Reconciliation Session
export interface ReconciliationSession {
  id: string;
  bank_upload_id?: string | null;
  razorpay_upload_id?: string | null;
  invoice_upload_id?: string | null;
  total_records: number;
  matched_count: number;
  review_count: number;
  exception_count: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  started_at: string;
  completed_at?: string | null;
}

// Reconciliation Result Item
export interface ReconciliationResult {
  id: string;
  session_id: string;
  invoice_id?: string | null;
  settlement_id?: string | null;
  bank_txn_id?: string | null;
  match_type: MatchType;
  confidence_score: number;
  status: MatchStatus;
  matched_on?: Record<string, unknown> | null;
  amount_difference?: number | null;
  ai_explanation?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_action?: ReviewAction | null;
  created_at: string;

  // Joined entity objects (optional for detailed views)
  invoice?: Invoice | null;
  settlement?: RazorpaySettlement | null;
  bank_transaction?: BankTransaction | null;
}

// Dashboard Summary Data
export interface DashboardSummary {
  total_transactions: number;
  matched: number;
  review_required: number;
  exceptions: number;
  match_rate: number;
  total_amount_reconciled: number;
  pending_amount: number;
  recent_sessions: ReconciliationSession[];
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
