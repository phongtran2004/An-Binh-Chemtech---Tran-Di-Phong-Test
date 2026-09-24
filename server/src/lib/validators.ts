import { z } from 'zod';

/**
 * Validation schemas for API request bodies.
 * Using Zod for runtime type checking on both client & server.
 */

// --- Quotation Item ---
export const quotationItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Tên sản phẩm không được để trống'),
  specification: z.string().default(''),
  unit: z.string().min(1, 'Đơn vị tính không được để trống'),
  quantity: z.number().positive('Số lượng phải lớn hơn 0'),
  unitPrice: z.number().nonnegative('Đơn giá không được âm'),
  discount: z.number().min(0).max(100).default(0),
  sortOrder: z.number().int().default(0),
});

// --- Create Quotation ---
export const createQuotationSchema = z.object({
  customerId: z.string().uuid('Customer ID không hợp lệ'),
  paymentTerms: z.string().default('Thanh toán trong vòng 30 ngày'),
  deliveryTerms: z.string().default('Giao tại kho người mua'),
  notes: z.string().default(''),
  validityDays: z.number().int().positive().default(30),
  items: z
    .array(quotationItemSchema)
    .min(1, 'Báo giá phải có ít nhất 1 sản phẩm'),
  idempotencyKey: z.string().optional(),
});

// --- Submit Quotation (trigger processing) ---
export const submitQuotationSchema = z.object({
  idempotencyKey: z.string().optional(),
});

// Infer TypeScript types from schemas
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;
