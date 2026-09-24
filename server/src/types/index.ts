export type QuotationStatus = 'DRAFT' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CustomerData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxCode: string | null;
}

export interface QuotationItemData {
  productName: string;
  specification: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  amount: number;
}

export interface QuotationGenerateData {
  quotationNumber: string;
  createdAt: Date;
  validityDays: number;
  paymentTerms: string;
  deliveryTerms: string;
  notes: string;
  technicalAdvisory?: string;
  commercialNote?: string;
  customer: CustomerData;
  items: QuotationItemData[];
}

export interface WorkerStatusInfo {
  isOnline: boolean;
  workerName: string;
  mode: 'SIMULATED_MAC_MINI' | 'LIVE_AGENT';
  codexCliEnabled: boolean;
  activeJobsCount: number;
  lastHeartbeat: string;
}
