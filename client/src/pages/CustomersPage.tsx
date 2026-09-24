import { useNavigate } from 'react-router-dom';
import { customerApi } from '../services/api';
import { useAsyncData } from '../hooks/useAsyncData';
import type { Customer } from '../types';

/**
 * CustomersPage - Landing page showing all customers.
 * Entry point of the quotation workflow per the assessment requirements.
 */

export default function CustomersPage() {
  const navigate = useNavigate();
  const { data: customers, loading, error } = useAsyncData<Customer[]>(
    async () => (await customerApi.list()).data,
  );

  if (loading) {
    return (
      <>
        <div className="page-header">
          <h2>Khách hàng</h2>
          <p>Danh sách khách hàng trong hệ thống</p>
        </div>
        <div className="loading-overlay">
          <div className="spinner spinner-lg" />
          <p>Đang tải...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="page-header">
          <h2>Khách hàng</h2>
        </div>
        <div className="page-body">
          <div className="alert alert-error">{error}</div>
        </div>
      </>
    );
  }

  const list = customers || [];

  return (
    <div className="page-enter">
      <div className="page-header">
        <h2>Khách hàng</h2>
        <p>Chọn khách hàng để xem chi tiết hoặc tạo báo giá</p>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid grid-4 mb-6">
          <div className="card stat-card">
            <div className="stat-value">{list.length}</div>
            <div className="stat-label">Tổng khách hàng</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">
              {list.reduce((sum, c) => sum + (c._count?.quotations || 0), 0)}
            </div>
            <div className="stat-label">Tổng báo giá</div>
          </div>
        </div>

        {/* Customer list */}
        <div className="grid grid-3">
          {list.map((customer) => (
            <div
              key={customer.id}
              className="card card-clickable"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold">{customer.companyName}</h3>
                  {(customer._count?.quotations || 0) > 0 && (
                    <span className="badge badge-completed">
                      {customer._count?.quotations} BG
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted flex-col gap-1">
                  <div>👤 {customer.contactPerson}</div>
                  <div>📞 {customer.phone}</div>
                  <div className="truncate">📧 {customer.email}</div>
                </div>
              </div>
              <div className="card-footer">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-primary-600)' }}>
                  Xem chi tiết →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
