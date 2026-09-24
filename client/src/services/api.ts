/**
 * API service layer.
 * Centralizes all HTTP requests to the backend.
 * Single source of truth for API endpoints.
 */

import type {
  Customer,
  Product,
  Quotation,
  CreateQuotationInput,
  WorkerStatus,
  ApiResponse,
} from '../types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json;
}

// --- Customers ---
export const customerApi = {
  list: () => request<ApiResponse<Customer[]>>('/customers'),
  getById: (id: string) => request<ApiResponse<Customer>>(`/customers/${id}`),
};

// --- Products ---
export const productApi = {
  list: () => request<ApiResponse<Product[]>>('/products'),
};

// --- Quotations ---
export const quotationApi = {
  list: () => request<ApiResponse<Quotation[]>>('/quotations'),

  getById: (id: string) =>
    request<ApiResponse<Quotation>>(`/quotations/${id}`),

  create: (data: CreateQuotationInput) =>
    request<ApiResponse<Quotation>>('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  retry: (id: string) =>
    request<ApiResponse<Quotation>>(`/quotations/${id}/retry`, {
      method: 'POST',
    }),

  getDownloadUrl: (id: string) => `${API_BASE}/quotations/${id}/download`,
};

// --- Mac mini Worker Node Status ---
export const workerApi = {
  getStatus: () => request<ApiResponse<WorkerStatus>>('/worker/status'),
};
