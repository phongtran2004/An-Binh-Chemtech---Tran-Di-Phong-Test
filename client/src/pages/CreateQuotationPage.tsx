import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerApi, productApi, quotationApi } from '../services/api';
import { calculateItemAmount, formatCurrency, generateIdempotencyKey } from '../utils';
import type { Customer, Product, QuotationItemInput } from '../types';

/**
 * CreateQuotationPage - Enterprise quotation builder for An Bình Chemtech.
 * Inputs client request -> passes to Mac mini automation node -> master template filler.
 */

const EMPTY_ITEM: QuotationItemInput = {
  productId: '',
  productName: '',
  specification: '',
  unit: 'Kg',
  quantity: 100,
  unitPrice: 0,
  discount: 0,
};

export default function CreateQuotationPage() {
  const { id: customerId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [items, setItems] = useState<QuotationItemInput[]>([{ ...EMPTY_ITEM }]);
  const [paymentTerms, setPaymentTerms] = useState('Thanh toán trong vòng 30 ngày kể từ ngày nhận đủ hàng và hóa đơn GTGT');
  const [deliveryTerms, setDeliveryTerms] = useState('Giao hàng tận kho bên mua (DDP), phương tiện chuyên dụng bảo đảm an toàn');
  const [notes, setNotes] = useState('Bao gồm chứng chỉ phân tích chất lượng (COA) và bảng dữ liệu an toàn (MSDS)');
  const [validityDays, setValidityDays] = useState(30);

  useEffect(() => {
    if (customerId) loadData(customerId);
  }, [customerId]);

  async function loadData(cId: string) {
    try {
      setLoading(true);
      const [custRes, prodRes] = await Promise.all([
        customerApi.getById(cId),
        productApi.list(),
      ]);
      setCustomer(custRes.data);
      setProducts(prodRes.data);

      // Pre-fill with first catalog product if available
      if (prodRes.data.length > 0) {
        const p = prodRes.data[0];
        setItems([
          {
            productId: p.id,
            productName: p.name,
            specification: p.specification,
            unit: p.unit,
            quantity: 500,
            unitPrice: p.defaultPrice,
            discount: 0,
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  // --- Item management ---
  function updateItem(index: number, field: keyof QuotationItemInput, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function handleSelectCatalogProduct(index: number, productId: string) {
    if (!productId) {
      updateItem(index, 'productId', '');
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: product.id,
              productName: product.name,
              specification: product.specification,
              unit: product.unit,
              unitPrice: product.defaultPrice,
            }
          : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Validation ---
  function validate(): string | null {
    if (items.length === 0) return 'Báo giá phải có ít nhất 1 sản phẩm hóa chất';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productName.trim()) return `Dòng #${i + 1}: Vui lòng chọn hoặc nhập tên sản phẩm`;
      if (!item.unit.trim()) return `Dòng #${i + 1}: Đơn vị tính không được để trống`;
      if (item.quantity <= 0) return `Dòng #${i + 1}: Số lượng phải lớn hơn 0`;
      if (item.unitPrice < 0) return `Dòng #${i + 1}: Đơn giá không được âm`;
    }
    return null;
  }

  // --- Submit ---
  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!customerId) return;

    try {
      setSubmitting(true);
      setError('');

      const res = await quotationApi.create({
        customerId,
        paymentTerms,
        deliveryTerms,
        notes,
        validityDays,
        items: items.map((item) => ({
          ...item,
          productId: item.productId || undefined,
        })),
        idempotencyKey: generateIdempotencyKey(customerId),
      });

      // Navigate to status tracking & download page
      navigate(`/quotations/${res.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu tạo báo giá');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-enter">
        <div className="page-header">
          <h2>Tạo báo giá</h2>
        </div>
        <div className="loading-overlay">
          <div className="spinner spinner-lg" />
          <p>Đang chuẩn bị mẫu báo giá...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="page-enter">
        <div className="page-header">
          <h2>Tạo báo giá</h2>
        </div>
        <div className="page-body">
          <div className="alert alert-error">Không tìm thấy thông tin khách hàng</div>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + calculateItemAmount(item.quantity, item.unitPrice, item.discount), 0);
  const vat = subtotal * 0.1;
  const grandTotal = subtotal + vat;

  // Group products by category
  const productsByCategory = products.reduce<Record<string, Product[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">Khách hàng</Link>
          <span className="separator">/</span>
          <Link to={`/customers/${customer.id}`}>{customer.companyName}</Link>
          <span className="separator">/</span>
          <span>Tạo báo giá</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2>Tạo báo giá mới</h2>
            <p>Quy trình: Nhập liệu → Gửi sang Mac mini (Codex CLI) → Xuất file từ mẫu chuẩn An Bình Chemtech</p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {error && (
          <div className="alert alert-error mb-6">
            ⚠️ {error}
          </div>
        )}

        {/* Workflow Info Banner */}
        <div className="workflow-banner">
          <div className="workflow-banner-content">
            <h4>Quy trình Tự động hóa Báo giá An Bình Chemtech</h4>
            <p>
              Dữ liệu sau khi nhấn "Gửi" sẽ chuyển tới Mac mini Automation Node. Codex CLI sẽ tự động hỗ trợ soạn thảo thư ngỏ, lưu ý an toàn kỹ thuật hóa chất và điền chuẩn xác vào file mẫu <code>quotation_template.xlsx</code>.
            </p>
          </div>
          <div className="workflow-banner-node">
            <span className="node-icon">🖥️</span>
            <div className="node-label">Node Mac mini</div>
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="card mb-6">
          <div className="card-header">
            <h3>Thông tin khách hàng & Pháp nhân tiếp nhận</h3>
          </div>
          <div className="card-body">
            <div className="info-grid">
              <span className="info-label">Đơn vị:</span>
              <span className="info-value font-semibold">{customer.companyName}</span>

              <span className="info-label">Người nhận báo giá:</span>
              <span className="info-value">{customer.contactPerson}</span>

              <span className="info-label">Số điện thoại:</span>
              <span className="info-value">{customer.phone}</span>

              <span className="info-label">Email:</span>
              <span className="info-value">{customer.email}</span>

              <span className="info-label">Địa chỉ giao hàng:</span>
              <span className="info-value">{customer.address}</span>

              <span className="info-label">Mã số thuế:</span>
              <span className="info-value">{customer.taxCode || '—'}</span>
            </div>
          </div>
        </div>

        {/* Chemical Products Table */}
        <div className="card mb-6">
          <div className="card-header">
            <div>
              <h3>Danh mục hóa chất & Bảng giá</h3>
              <p className="text-sm text-muted mt-2">
                Chọn từ danh mục tiêu chuẩn hoặc nhập sản phẩm / quy cách đặc thù
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={addItem}>
              + Thêm hóa chất
            </button>
          </div>

          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="items-table" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>STT</th>
                  <th style={{ minWidth: 300 }}>Chọn hóa chất</th>
                  <th style={{ minWidth: 160 }}>Quy cách / Nồng độ</th>
                  <th style={{ width: 80 }}>ĐVT</th>
                  <th style={{ width: 100 }}>Số lượng</th>
                  <th style={{ width: 130 }}>Đơn giá (VNĐ)</th>
                  <th style={{ width: 70 }}>CK (%)</th>
                  <th style={{ width: 140, textAlign: 'right' }}>Thành tiền</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }} className="text-muted font-semibold">
                      {index + 1}
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={item.productId || ''}
                        onChange={(e) => handleSelectCatalogProduct(index, e.target.value)}
                      >
                        <option value="">-- Chọn từ Catalog Hóa chất --</option>
                        {Object.entries(productsByCategory).map(([category, prods]) => (
                          <optgroup key={category} label={category}>
                            {prods.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.specification})
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <div className="product-cell-label">Tên hiển thị trên báo giá:</div>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Tên sẽ in trên báo giá"
                        value={item.productName}
                        onChange={(e) => updateItem(index, 'productName', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Quy cách đóng gói"
                        value={item.specification}
                        onChange={(e) => updateItem(index, 'specification', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Kg / Phuy"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="1000"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                      />
                    </td>
                    <td className="text-right font-semibold">
                      {formatCurrency(calculateItemAmount(item.quantity, item.unitPrice, item.discount))} ₫
                    </td>
                    <td className="col-action">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                        title="Xóa dòng"
                        style={{ color: 'var(--color-error)' }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="card-footer">
            <div className="totals-section">
              <div className="totals-table">
                <div className="total-row">
                  <span>Tiền hàng trước thuế:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)} ₫</span>
                </div>
                <div className="total-row">
                  <span>Thuế GTGT (VAT 10%):</span>
                  <span>{formatCurrency(vat)} ₫</span>
                </div>
                <div className="total-row grand-total">
                  <span>TỔNG CỘNG THANH TOÁN:</span>
                  <span>{formatCurrency(grandTotal)} ₫</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Terms & Conditions */}
        <div className="card mb-6">
          <div className="card-header">
            <h3>Điều kiện thương mại & Kỹ thuật</h3>
          </div>
          <div className="card-body">
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Điều kiện thanh toán</label>
                <input
                  className="form-input"
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Điều kiện giao hàng</label>
                <input
                  className="form-input"
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Thời hạn hiệu lực báo giá (ngày)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="365"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ghi chú bổ sung (COA, MSDS, Tiêu chuẩn đóng gói)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Ghi chú thêm cho bên nhận báo giá..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/customers/${customer.id}`)}
            disabled={submitting}
          >
            ← Quay lại chi tiết khách hàng
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Đang chuyển sang Mac mini...
              </>
            ) : (
              '📤 Gửi yêu cầu sang Mac mini tạo báo giá'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
