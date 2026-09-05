import axios from 'axios';
import {
  ApiResponse,
  SourceType,
  UploadResponseData,
  ReconciliationResult,
  DashboardSummary,
  PaginationMeta,
  AuthResponse,
  UserProfile,
  UserSessionHistoryItem,
  CompanyData,
} from '@/types';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach JWT Bearer token to all outgoing requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data?.error;
    const message = errorData?.message || error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ── Auth API ────────────────────────────────────────────────────────────────
export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Login failed');
  }
  return res.data.data;
}

export async function registerApi(data: {
  email: string;
  name: string;
  password: string;
  role?: string;
  company_name?: string;
}): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Registration failed');
  }
  return res.data.data;
}

export async function getMeApi(): Promise<UserProfile> {
  const res = await apiClient.get<ApiResponse<UserProfile>>('/auth/me');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch user profile');
  }
  return res.data.data;
}

export async function getUserHistoryApi(): Promise<UserSessionHistoryItem[]> {
  const res = await apiClient.get<ApiResponse<UserSessionHistoryItem[]>>('/auth/history');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch session history');
  }
  return res.data.data;
}

export async function resumeSessionApi(sessionId: string): Promise<{ session_id: string; company_name: string }> {
  const res = await apiClient.post<ApiResponse<{ session_id: string; company_name: string }>>(`/auth/resume/${sessionId}`);
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to resume session');
  }
  return res.data.data;
}

export async function logoutApi(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch (e) {
    // ignore
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

// ── Multi-Company API ───────────────────────────────────────────────────────
export async function getCompaniesApi(): Promise<CompanyData[]> {
  const res = await apiClient.get<ApiResponse<any[]>>('/companies');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch companies');
  }
  return res.data.data.map((c) => ({
    id: c.id,
    name: c.name,
    industry: c.industry || 'Technology & Services',
    matchRate: c.match_rate || 0,
    total_records: c.total_records || 0,
    anomaly_status: c.anomaly_status || 'NONE',
    match_status: c.match_status || 'MATCHED',
    invoice_amount: c.invoice_amount || 0,
    razorpay_amount: c.razorpay_amount || 0,
    bank_amount: c.bank_amount || 0,
  }));
}

export async function createCompanyApi(name: string, industry?: string): Promise<CompanyData> {
  const res = await apiClient.post<ApiResponse<any>>('/companies', { name, industry });
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to create company');
  }
  const c = res.data.data;
  return {
    id: c.id,
    name: c.name,
    industry: c.industry,
    matchRate: c.match_rate || 100,
    total_records: c.total_records || 0,
    anomaly_status: c.anomaly_status || 'NONE',
    match_status: c.match_status || 'MATCHED',
    invoice_amount: c.invoice_amount || 0,
    razorpay_amount: c.razorpay_amount || 0,
    bank_amount: c.bank_amount || 0,
  };
}

// ── Upload API ───────────────────────────────────────────────────────────────
export async function uploadCSV(file: File, sourceType: SourceType): Promise<UploadResponseData> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source_type', sourceType);

  const res = await apiClient.post<ApiResponse<UploadResponseData>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to upload CSV');
  }
  return res.data.data;
}

// ── Reconciliation API ───────────────────────────────────────────────────────
export interface ReconciliationSummary {
  session_id: string;
  total_records: number;
  matched: number;
  review_required: number;
  exceptions: number;
  processing_time_ms: number;
}

export async function triggerReconciliation(
  bankUploadId: string,
  razorpayUploadId: string,
  invoiceUploadId: string,
  companyName?: string
): Promise<ReconciliationSummary> {
  const res = await apiClient.post<ApiResponse<ReconciliationSummary>>('/reconcile', {
    bank_upload_id: bankUploadId,
    razorpay_upload_id: razorpayUploadId,
    invoice_upload_id: invoiceUploadId,
    company_name: companyName,
  });

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Reconciliation failed');
  }
  return res.data.data;
}

export async function getReconciliationResults(
  sessionId: string,
  status?: string,
  page = 1,
  limit = 50
): Promise<{ results: ReconciliationResult[]; pagination: PaginationMeta }> {
  const params: Record<string, unknown> = { page, limit };
  if (status) params.status = status;

  const res = await apiClient.get<ApiResponse<{ results: ReconciliationResult[]; pagination: PaginationMeta }>>(
    `/reconcile/${sessionId}/results`,
    { params }
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch results');
  }
  return res.data.data;
}

export async function getTransactionDetail(
  sessionId: string,
  resultId: string
): Promise<ReconciliationResult> {
  const res = await apiClient.get<ApiResponse<ReconciliationResult>>(
    `/reconcile/${sessionId}/results/${resultId}`
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch detail');
  }
  return res.data.data;
}

export async function reviewReconciliationItem(
  sessionId: string,
  resultId: string,
  action: 'APPROVED' | 'REJECTED',
  notes?: string
): Promise<{ result_id: string; status: string; review_action: string }> {
  const res = await apiClient.post<ApiResponse<{ result_id: string; status: string; review_action: string }>>(
    `/reconcile/${sessionId}/results/${resultId}/review`,
    { action, notes }
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to review transaction');
  }
  return res.data.data;
}

// ── Dashboard API ────────────────────────────────────────────────────────────
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch dashboard summary');
  }
  return res.data.data;
}

// ── Exceptions API ───────────────────────────────────────────────────────────
export async function getExceptions(
  sessionId?: string,
  page = 1,
  limit = 50
): Promise<{ results: ReconciliationResult[]; pagination: PaginationMeta }> {
  const params: Record<string, unknown> = { page, limit };
  if (sessionId) params.session_id = sessionId;

  const res = await apiClient.get<ApiResponse<{ results: ReconciliationResult[]; pagination: PaginationMeta }>>(
    '/exceptions',
    { params }
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error?.message || 'Failed to fetch exceptions');
  }
  return res.data.data;
}

// ── Reports API ───────────────────────────────────────────────────────────────
export async function exportReport(sessionId: string, format: 'csv' | 'json' = 'csv'): Promise<void> {
  const url = `${baseURL}/reports/${sessionId}/export?format=${format}`;
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `reconciliation_${sessionId}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export async function getSessionSummary(sessionId: string): Promise<{
  session_id: string;
  total_records: number;
  matched: number;
  review_required: number;
  exceptions: number;
  match_rate_pct: number;
  exception_list: Array<{ result_id: string; order_id: string; confidence_score: number; explanation: string }>;
}> {
  const res = await apiClient.get(`/reports/${sessionId}/summary`);
  if (!res.data) throw new Error('Failed to fetch session summary');
  return res.data;
}

export default apiClient;
