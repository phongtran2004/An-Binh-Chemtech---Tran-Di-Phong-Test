import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerApi } from '../services/api';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate, formatCurrency } from '../utils';
import StatusBadge from '../components/StatusBadge';
import type { Customer, Quotation, QuotationStatus } from '../types';

/**
 * CustomerDetailPage - Shows customer info + quotation history.
 * Contains the "Tạo báo giá" button that starts the quotation workflow.
 */

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: customer, loading, error } = useAsyncData<Customer>(
    async () => (await customerApi.getById(id!)).data,
    [id],
    { enabled: !!id },
  );

  if (loading) {
    return (
      <>
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/">Khách hàng</Link>
            <span className="separator">/</span>
            <span>Đang tải...</span>
          </div>
          <h2>Chi tiết khách hàng</h2>
        </div>
        <div className="loading-overlay">
          <div className="spinner spinner-lg" />
        </div>
      </>
    );
  }

  if (error || !customer) {
    return (
      <>
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/">Khách hàng</Link>
            <span className="separator">/</span>
            <span>Lỗi</span>
          </div>
          <h2>Chi tiết khách hàng</h2>
        </div>
        <div className="page-body">
          <div className="alert alert-error">{error || 'Không tìm thấy khách hàng'}</div>
        </div>
      </>
    );
  }

  const quotations = customer.quotations || [];

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">Khách hàng</Link>
          <span className="separator">/</span>
          <span>{customer.companyName}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/')}>
              ← Quay lại
            </button>
            <div>
              <h2>{customer.companyName}</h2>
              <p>Thông tin chi tiết và lịch sử báo giá</p>
            </div>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/customers/${customer.id}/quotation/new`)}
          >
            📋 Tạo báo giá
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Customer info */}
        <div className="card mb-6">
          <div className="card-header">
            <h3>Thông tin khách hàng</h3>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <span className="info-label">Công ty</span>
              <span className="info-value">{customer.companyName}</span>

              <span className="info-label">Người liên hệ</span>
              <span className="info-value">{customer.contactPerson}</span>

              <span className="info-label">Điện thoại</span>
              <span className="info-value">{customer.phone}</span>

              <span className="info-label">Email</span>
              <span className="info-value">{customer.email}</span>

              <span className="info-label">Địa chỉ</span>
              <span className="info-value">{customer.address}</span>

              {customer.taxCode && (
                <>
                  <span className="info-label">Mã số thuế</span>
                  <span className="info-value">{customer.taxCode}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quotation history */}
        <div className="card">
          <div className="card-header">
            <h3>Lịch sử báo giá ({quotations.length})</h3>
          </div>

          {quotations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Chưa có báo giá nào</h3>
              <p>Nhấn "Tạo báo giá" để bắt đầu tạo báo giá cho khách hàng này.</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Số báo giá</th>
                    <th>Ngày tạo</th>
                    <th>Số SP</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q: Quotation) => {
                    const total = q.items.reduce((sum, item) => sum + item.amount, 0);
                    return (
                      <tr key={q.id}>
                        <td>
                          <span className="font-semibold" style={{ color: 'var(--color-primary-700)' }}>
                            {q.quotationNumber}
                          </span>
                        </td>
                        <td>{formatDate(q.createdAt)}</td>
                        <td>{q.items.length} sản phẩm</td>
                        <td className="font-semibold">{formatCurrency(total)} ₫</td>
                        <td>
                          <StatusBadge status={q.status as QuotationStatus} />
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/quotations/${q.id}`)}
                          >
                            Xem →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
