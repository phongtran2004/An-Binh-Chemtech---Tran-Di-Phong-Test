import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { quotationApi } from '../services/api';
import { formatDate, formatCurrency } from '../utils';
import StatusBadge from '../components/StatusBadge';
import WorkflowTracker from '../components/WorkflowTracker';
import StatusAlert from '../components/StatusAlert';
import type { Quotation, QuotationStatus } from '../types';

/**
 * QuotationDetailPage - Real-time tracking of Mac mini automation & Master Template generation.
 *
 * Refactored:
 * - Extracted WorkflowTracker and StatusAlert into reusable components
 * - Replaced ~300 lines of inline styles with CSS classes from design system
 * - Added stale data check to prevent unnecessary re-renders during polling
 */

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const lastStatusRef = useRef<string>('');

  const loadQuotation = useCallback(async (quotationId: string) => {
    try {
      const res = await quotationApi.getById(quotationId);
      const data = res.data;

      // Stale data check: only update state if status actually changed
      // This prevents unnecessary re-renders during polling
      if (data.status !== lastStatusRef.current || !quotation) {
        setQuotation(data);
        lastStatusRef.current = data.status;
      }

      setLoading(false);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
      setLoading(false);
      return null;
    }
  }, [quotation]);

  // Initial load + Polling when PENDING or PROCESSING
  useEffect(() => {
    if (!id) return;

    loadQuotation(id);

    const interval = setInterval(async () => {
      const q = await loadQuotation(id);
      if (q && (q.status === 'COMPLETED' || q.status === 'FAILED')) {
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [id, loadQuotation]);

  async function handleRetry() {
    if (!id) return;
    try {
      setRetrying(true);
      await quotationApi.retry(id);
      lastStatusRef.current = ''; // Force reload on next poll
      await loadQuotation(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thử lại');
    } finally {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <div className="page-enter">
        <div className="page-header">
          <h2>Chi tiết báo giá</h2>
        </div>
        <div className="loading-overlay">
          <div className="spinner spinner-lg" />
          <p>Đang tải tiến trình báo giá...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="page-enter">
        <div className="page-header">
          <h2>Chi tiết báo giá</h2>
        </div>
        <div className="page-body">
          <div className="alert alert-error">{error || 'Không tìm thấy báo giá'}</div>
        </div>
      </div>
    );
  }

  const subtotal = quotation.items.reduce((sum, item) => sum + item.amount, 0);
  const vat = subtotal * 0.1;
  const grandTotal = subtotal + vat;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">Khách hàng</Link>
          <span className="separator">/</span>
          {quotation.customer && (
            <>
              <Link to={`/customers/${quotation.customerId}`}>
                {quotation.customer.companyName}
              </Link>
              <span className="separator">/</span>
            </>
          )}
          <span>{quotation.quotationNumber}</span>
        </div>

        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="flex items-center gap-3">
              {quotation.quotationNumber}
              <StatusBadge status={quotation.status as QuotationStatus} />
            </h2>
            <p>Khởi tạo lúc: {formatDate(quotation.createdAt)} | File mẫu: <code>quotation_template.xlsx</code></p>
          </div>

          <div className="flex gap-3">
            {quotation.status === 'FAILED' && (
              <button
                className="btn btn-danger"
                onClick={handleRetry}
                disabled={retrying}
              >
                {retrying ? '⏳ Đang gửi lại...' : '🔄 Thử lại tiến trình'}
              </button>
            )}
            {quotation.status === 'COMPLETED' && (
              <a
                href={quotationApi.getDownloadUrl(quotation.id)}
                className="btn btn-success btn-lg"
                download
              >
                📥 Tải file báo giá hoàn chỉnh (.xlsx)
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Real-time Automation Step Tracker */}
        <WorkflowTracker status={quotation.status as QuotationStatus} />

        {/* Live Status Alerts */}
        <StatusAlert
          status={quotation.status as QuotationStatus}
          errorMessage={quotation.errorMessage}
          completedAt={quotation.completedAt}
        />

        {/* Visual Document Preview */}
        <div className="card doc-preview mb-6">
          {/* Document Header */}
          <div className="doc-header">
            <div className="doc-header-top">
              <div>
                <h2 className="doc-brand-name">
                  CÔNG TY CỔ PHẦN HÓA CHẤT AN BÌNH
                </h2>
                <div className="doc-brand-contact">
                  KCN Đình Vũ, Hải Phòng | Hotline: (+84) 225 388 9966 | Website: www.anbinhchemtech.vn
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="doc-number-badge">
                  {quotation.quotationNumber}
                </span>
                <div className="doc-number-date">
                  Ngày lập: {formatDate(quotation.createdAt, false)}
                </div>
              </div>
            </div>

            <div className="doc-title-block">
              <h1 className="doc-title">BÁO GIÁ THƯƠNG MẠI</h1>
              <div className="doc-subtitle">COMMERCIAL QUOTATION & TECHNICAL SPECIFICATION</div>
            </div>
          </div>

          {/* Customer & Commercial Info Section */}
          <div className="doc-info-section">
            <div className="doc-info-grid">
              <div>
                <div className="doc-info-title">THÔNG TIN KHÁCH HÀNG:</div>
                <div className="doc-info-body">
                  <div><strong>Đơn vị:</strong> {quotation.customer?.companyName}</div>
                  <div><strong>Người liên hệ:</strong> {quotation.customer?.contactPerson}</div>
                  <div><strong>Điện thoại:</strong> {quotation.customer?.phone} | <strong>Email:</strong> {quotation.customer?.email}</div>
                  <div><strong>Địa chỉ:</strong> {quotation.customer?.address}</div>
                  {quotation.customer?.taxCode && <div><strong>Mã số thuế:</strong> {quotation.customer?.taxCode}</div>}
                </div>
              </div>

              <div>
                <div className="doc-info-title">THÔNG TIN THƯƠNG MẠI:</div>
                <div className="doc-info-body">
                  <div><strong>Hiệu lực báo giá:</strong> {quotation.validityDays} ngày kể từ ngày lập</div>
                  <div><strong>Thanh toán:</strong> {quotation.paymentTerms}</div>
                  <div><strong>Giao hàng:</strong> {quotation.deliveryTerms}</div>
                  {quotation.notes && <div><strong>Ghi chú:</strong> {quotation.notes}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="doc-body">
            <div className="table-container" style={{ border: '1px solid #cbd5e0', borderRadius: 'var(--radius-sm)' }}>
              <table>
                <thead>
                  <tr style={{ background: '#1a365d', color: '#fff' }}>
                    <th style={{ width: 45, textAlign: 'center', color: '#fff' }}>STT</th>
                    <th style={{ color: '#fff' }}>Tên hóa chất / Sản phẩm</th>
                    <th style={{ color: '#fff' }}>Quy cách / Nồng độ</th>
                    <th style={{ textAlign: 'center', color: '#fff' }}>ĐVT</th>
                    <th style={{ textAlign: 'right', color: '#fff' }}>Số lượng</th>
                    <th style={{ textAlign: 'right', color: '#fff' }}>Đơn giá (VNĐ)</th>
                    <th style={{ textAlign: 'center', color: '#fff' }}>CK (%)</th>
                    <th style={{ textAlign: 'right', color: '#fff' }}>Thành tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={item.id} style={{ background: index % 2 === 1 ? '#f8fafc' : '#fff' }}>
                      <td className="text-center text-muted">{index + 1}</td>
                      <td className="font-semibold">{item.productName}</td>
                      <td className="text-muted">{item.specification || 'Theo tiêu chuẩn NSX'}</td>
                      <td className="text-center">{item.unit}</td>
                      <td className="text-right">{formatCurrency(item.quantity)}</td>
                      <td className="text-right">{formatCurrency(item.unitPrice)} ₫</td>
                      <td className="text-center">{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                      <td className="text-right font-semibold">{formatCurrency(item.amount)} ₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Document Totals */}
            <div className="doc-totals">
              <div className="doc-totals-inner">
                <div className="doc-total-row">
                  <span className="doc-total-label">Tổng tiền hàng:</span>
                  <span className="doc-total-value">{formatCurrency(subtotal)} ₫</span>
                </div>
                <div className="doc-total-row">
                  <span className="doc-total-label">Thuế GTGT (VAT 10%):</span>
                  <span>{formatCurrency(vat)} ₫</span>
                </div>
                <div className="doc-total-row doc-total-row--grand">
                  <span>TỔNG CỘNG THANH TOÁN:</span>
                  <span className="doc-total-value">{formatCurrency(grandTotal)} ₫</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="doc-signatures">
              <div>
                <div className="doc-sign-title">ĐẠI DIỆN BÊN MUA</div>
                <div className="doc-sign-note">(Ký, ghi rõ họ tên)</div>
              </div>
              <div>
                <div className="doc-sign-title doc-sign-title--company">ĐẠI DIỆN AN BÌNH CHEMTECH</div>
                <div className="doc-sign-note">(Ký, đóng dấu xác nhận)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
