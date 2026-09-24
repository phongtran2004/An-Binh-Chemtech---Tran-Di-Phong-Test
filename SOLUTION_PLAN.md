# AN BÌNH CHEMTECH — KẾ HOẠCH GIẢI PHÁP KỸ THUẬT

## 1. Phân tích bài toán

An Bình Chemtech cần giảm thao tác thủ công trong quy trình lập báo giá. Luồng nghiệp vụ yêu cầu:

```
Trang chi tiết KH → Tạo báo giá → Nhập dữ liệu → Gửi → Mac mini → Codex CLI → Mẫu báo giá → File hoàn chỉnh
```

Prototype tập trung chứng minh luồng chính end-to-end, không phải xây hệ thống CRM hoàn chỉnh.

---

## 2. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                   HỆ THỐNG QUẢN LÝ NỘI BỘ                    │
│                                                               │
│   Frontend SPA              REST / JSON         Express API   │
│   (React + Vite + TS)  ◄──────────────────►  (Service Layer)  │
│                                                     │         │
│   • Danh sách khách hàng                            │ Prisma  │
│   • Form lập báo giá                                ▼         │
│   • Giám sát trạng thái                       ┌──────────┐   │
│   • Xem trước & Tải XLSX                      │  SQLite   │   │
│                                                └─────▲────┘   │
└──────────────────────────────────────────────────────┼────────┘
                                                       │ Polling
                                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                MAC MINI AUTOMATION WORKER NODE                │
│                                                               │
│   Job Dispatcher (Nhận PENDING → Chuyển PROCESSING)          │
│                                                               │
│   ┌──────────────────┐         ┌─────────────────────┐       │
│   │ Codex CLI (AI)   │         │ Deterministic Core   │       │
│   │ • Thư ngỏ KH     │         │ • Tính tiền, VAT     │       │
│   │ • Lưu ý an toàn  │         │ • Chiết khấu          │       │
│   └────────┬─────────┘         └──────────┬──────────┘       │
│            └──────────┬───────────────────┘                   │
│                       ▼                                       │
│            Template Engine (ExcelJS)                          │
│            Đọc mẫu → Điền dữ liệu → Xuất XLSX              │
└─────────────────────────────────────────────────────────────┘
```

### Luồng dữ liệu tuần tự

1. Nhân viên mở trang chi tiết khách hàng, nhấn "Tạo báo giá"
2. Nhập sản phẩm, số lượng, đơn giá, điều kiện thương mại → Nhấn "Gửi"
3. Frontend gửi `POST /api/quotations` kèm **Idempotency Key** (chống gửi trùng)
4. API validate dữ liệu bằng **Zod**, tạo bản ghi `status: PENDING` trong DB
5. **Mac mini Worker** polling DB, nhận job → chuyển sang `PROCESSING`
6. **Codex CLI** phân tích hóa chất, sinh thư ngỏ & khuyến cáo an toàn
7. **Template Engine** đọc file mẫu `quotation_template.xlsx`, điền dữ liệu vào đúng vị trí
8. Xuất file `BG-YYYYMMDD-XXX.xlsx` → cập nhật `status: COMPLETED`
9. Frontend poll trạng thái, hiển thị nút tải file khi hoàn tất

---

## 3. Vai trò Codex CLI vs Deterministic Code

Không phải mọi bước đều cần AI. Phân định rõ:

| Công việc | Phương pháp | Lý do |
|---|---|---|
| Tính toán (đơn giá × số lượng, chiết khấu, VAT 10%) | **Deterministic code** | Tài chính yêu cầu chính xác 100%, không chấp nhận rủi ro từ AI |
| Validation đầu vào | **Zod schema** | Phản hồi tức thì, có thể kiểm thử và tái lập |
| Điền dữ liệu vào template Excel | **ExcelJS** | Đảm bảo format, font, border nhất quán theo mẫu công ty |
| Thư ngỏ thương mại cá nhân hóa | **AI (Codex CLI)** | AI phù hợp để soạn lời chào linh hoạt theo ngữ cảnh KH |
| Khuyến cáo an toàn hóa chất | **AI (Codex CLI)** | Phân tích nhóm hóa chất (axit, kiềm, dung môi) để đưa lưu ý COA/MSDS |

### Cơ chế Fallback

Nếu Mac mini không có Codex CLI hoặc mất kết nối mạng → hệ thống tự động chuyển sang **Simulated Intelligence** (rule-based fallback) dựa trên phân loại hóa chất, đảm bảo luồng tạo báo giá không bị gián đoạn.

---

## 4. Xử lý rủi ro & Độ tin cậy

| Tình huống | Giải pháp |
|---|---|
| Người dùng click gửi liên tục | **Idempotency Key** sinh từ client, backend chặn trùng lặp |
| Dữ liệu đầu vào không hợp lệ | **Zod Schema Validation** chặn ngay tại API |
| Mac mini tạm mất kết nối | Job giữ trạng thái `PENDING`, worker tự quét lại khi online |
| Lỗi phát sinh giữa chừng | **Retry Policy**: tự động thử lại tối đa 3 lần, sau đó đánh dấu `FAILED` + nút thử lại thủ công |
| Xung đột đa tiến trình | Worker dùng **atomic `updateMany`** với điều kiện status check khi claim job |
| Mất file template gốc | Template Engine tự động khởi tạo lại template mặc định |

---

## 5. Bảo mật & Quản trị

- **Prototype**: Truy cập mở trong mạng nội bộ (phù hợp quy mô SME đánh giá)
- **Production**: Tích hợp SSO (Google Workspace / Azure AD), phân quyền RBAC
- **Bảo vệ file**: Endpoint download kiểm tra tồn tại file và đúng ID. Production: S3 với Presigned URLs
- **Logging**: Structured JSON logger, không ghi thông tin nhạy cảm KH ra log

---

## 6. Lộ trình nâng cấp Production

| Thành phần | Prototype | Production |
|---|---|---|
| Database | SQLite (đơn giản, không cần setup) | PostgreSQL (concurrency, transaction) |
| Job Queue | DB Polling | Redis BullMQ / RabbitMQ |
| File Storage | Local filesystem | S3 / MinIO + Presigned URLs |
| Auth | Không (mạng nội bộ) | SSO + RBAC |
| Export | XLSX | XLSX + PDF (chữ ký số) |
