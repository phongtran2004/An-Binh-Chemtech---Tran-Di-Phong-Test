/**
 * Shared TypeScript types for the client.
 * Mirrors the Prisma schema and API contracts.
 */

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxCode: string | null;
  createdAt: string;
  updatedAt: string;
  quotations?: Quotation[];
  _count?: { quotations: number };
}

export interface Product {
  id: string;
  name: string;
  specification: string;
  unit: string;
  defaultPrice: number;
  category: string;
}

export type QuotationStatus = 'DRAFT' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string | null;
  productName: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  amount: number;
  sortOrder: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer?: Customer;
  status: QuotationStatus;
  paymentTerms: string;
  deliveryTerms: string;
  notes: string;
  validityDays: number;
  filePath: string | null;
  idempotencyKey: string | null;
  retryCount: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  items: QuotationItem[];
}

export interface QuotationItemInput {
  productId?: string;
  productName: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CreateQuotationInput {
  customerId: string;
  paymentTerms: string;
  deliveryTerms: string;
  notes: string;
  validityDays: number;
  items: QuotationItemInput[];
  idempotencyKey?: string;
}

export interface WorkerStatus {
  isOnline: boolean;
  workerName: string;
  mode: 'SIMULATED_MAC_MINI' | 'LIVE_AGENT';
  codexCliEnabled: boolean;
  activeJobsCount: number;
  lastHeartbeat: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
}
