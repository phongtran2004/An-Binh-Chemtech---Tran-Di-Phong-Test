/**
 * Shared utility functions for the client application.
 * Single source of truth — eliminates duplicate formatDate/formatCurrency across pages.
 */

/**
 * Format ISO date string to Vietnamese locale.
 * @param dateStr - ISO date string from API
 * @param includeTime - Whether to include hours and minutes (default: true)
 */
export function formatDate(dateStr: string, includeTime = true): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  };
  return new Date(dateStr).toLocaleDateString('vi-VN', options);
}

/**
 * Format number as Vietnamese currency display (without currency symbol).
 * Use for displaying amounts in tables and summaries.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
}

/**
 * Calculate line item total amount after discount.
 */
export function calculateItemAmount(
  quantity: number,
  unitPrice: number,
  discount: number = 0
): number {
  return quantity * unitPrice * (1 - discount / 100);
}

/**
 * Generate a client-side idempotency key to prevent duplicate submissions.
 */
export function generateIdempotencyKey(customerId: string): string {
  return `quote-${customerId}-${Date.now()}`;
}
