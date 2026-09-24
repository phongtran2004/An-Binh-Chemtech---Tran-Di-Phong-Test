import { useNavigate } from 'react-router-dom';
import { quotationApi } from '../services/api';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate, formatCurrency } from '../utils';
import StatusBadge from '../components/StatusBadge';
import type { Quotation, QuotationStatus } from '../types';
import { useState } from 'react';

/**
 * QuotationsPage - Overview of all quotations across all customers.
 * Secondary navigation: list view with filtering by status.
 */

export default function QuotationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const navigate = useNavigate();

  const { data: quotations, loading, error, reload } = useAsyncData<Quotation[]>(
    async () => (await quotationApi.list()).data,
  );

  const list = quotations || [];

  const filtered =
    statusFilter === 'ALL'
      ? list
      : list.filter((q) => q.status === statusFilter);

  const statusCounts = list.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <>
        <div className="page-header">
          <h2>Báo giá</h2>
          <p>Tất cả báo giá trong hệ thống</p>
        </div>
        <div className="loading-overlay">
          <div className="spinner spinner-lg" />
        </div>
      </>
    );
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2>Báo giá</h2>
            <p>Tất cả báo giá trong hệ thống ({list.length})</p>
          </div>
          <button className="btn btn-secondary" onClick={reload}>
            🔄 Làm mới
          </button>
        </div>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error mb-6">{error}</div>}

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'Tất cả', count: list.length },
            { key: 'PENDING', label: 'Chờ xử lý', count: statusCounts['PENDING'] || 0 },
            { key: 'PROCESSING', label: 'Đang xử lý', count: statusCounts['PROCESSING'] || 0 },
            { key: 'COMPLETED', label: 'Hoàn thành', count: statusCounts['COMPLETED'] || 0 },
            { key: 'FAILED', label: 'Lỗi', count: statusCounts['FAILED'] || 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Không có báo giá nào</h3>
              <p>Chưa có báo giá {statusFilter !== 'ALL' ? 'với trạng thái này' : 'trong hệ thống'}</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Số báo giá</th>
                    <th>Khách hàng</th>
                    <th>Ngày tạo</th>
                    <th>Sản phẩm</th>
                    <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => {
                    const total = q.items.reduce((sum, item) => sum + item.amount, 0);
                    return (
                      <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/quotations/${q.id}`)}>
                        <td>
                          <span className="font-semibold" style={{ color: 'var(--color-primary-700)' }}>
                            {q.quotationNumber}
                          </span>
                        </td>
                        <td>{q.customer?.companyName || '—'}</td>
                        <td>{formatDate(q.createdAt)}</td>
                        <td>{q.items.length} SP</td>
                        <td style={{ textAlign: 'right' }} className="font-semibold">
                          {formatCurrency(total)} ₫
                        </td>
                        <td>
                          <StatusBadge status={q.status as QuotationStatus} />
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm">Xem →</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
