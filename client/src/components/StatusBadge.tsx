import type { QuotationStatus } from '../types';

/**
 * StatusBadge - Displays quotation status with appropriate color coding.
 * Reusable across all pages that show quotation status.
 */

interface StatusBadgeProps {
  status: QuotationStatus;
}

const STATUS_CONFIG: Record<QuotationStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Nháp', className: 'badge-draft' },
  PENDING: { label: 'Chờ xử lý', className: 'badge-pending' },
  PROCESSING: { label: 'Đang xử lý', className: 'badge-processing' },
  COMPLETED: { label: 'Hoàn thành', className: 'badge-completed' },
  FAILED: { label: 'Lỗi', className: 'badge-failed' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;

  return (
    <span className={`badge ${config.className}`}>
      {status === 'PROCESSING' && <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />}
      {config.label}
    </span>
  );
}
