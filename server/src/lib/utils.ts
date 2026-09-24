/**
 * Shared utility functions.
 */

/**
 * Generate a sequential quotation number.
 * Format: BG-YYYYMMDD-XXX (e.g., BG-20260924-001)
 */
export function generateQuotationNumber(sequenceNum: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(sequenceNum).padStart(3, '0');
  return `BG-${year}${month}${day}-${seq}`;
}

/**
 * Format number as Vietnamese currency (VND).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Calculate line item amount.
 */
export function calculateItemAmount(
  quantity: number,
  unitPrice: number,
  discount: number = 0
): number {
  return quantity * unitPrice * (1 - discount / 100);
}

/**
 * Sleep utility for simulating processing delay.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
