import type { QuotationStatus } from '../types';
import { formatDate } from '../utils';

/**
 * StatusAlert - Displays contextual alerts based on quotation processing status.
 * Replaces the duplicated inline conditional blocks in QuotationDetailPage.
 */

interface StatusAlertProps {
  status: QuotationStatus;
  errorMessage?: string | null;
  completedAt?: string | null;
}

export default function StatusAlert({ status, errorMessage, completedAt }: StatusAlertProps) {
  switch (status) {
    case 'PENDING':
      return (
        <div className="alert alert-info mb-6">
          ⏳ Đang xếp hàng chờ chuyển sang Mac mini... Hệ thống sẽ tự động cập nhật khi Worker xử lý.
        </div>
      );

    case 'PROCESSING':
      return (
        <div className="alert alert-info mb-6 alert-with-spinner">
          <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          <span>Mac mini Worker đang chạy: Phân tích danh mục hóa chất với Codex CLI và điền dữ liệu vào file mẫu...</span>
        </div>
      );

    case 'COMPLETED':
      return (
        <div className="alert alert-success mb-6">
          ✅ <strong>Báo giá đã hoàn tất!</strong> Mac mini đã xuất thành công file báo giá chuẩn từ template. Bạn có thể nhấn <strong>"Tải file báo giá hoàn chỉnh (.xlsx)"</strong> ở trên.
          {completedAt && (
            <span className="alert-timestamp">
              (Thời gian hoàn tất: {formatDate(completedAt)})
            </span>
          )}
        </div>
      );

    case 'FAILED':
      return (
        <div className="alert alert-error mb-6">
          ❌ <strong>Tiến trình bị gián đoạn:</strong> {errorMessage || 'Lỗi không xác định.'}
          <br />
          Bạn có thể bấm nút "Thử lại tiến trình" để Mac mini thực hiện lại.
        </div>
      );

    default:
      return null;
  }
}
