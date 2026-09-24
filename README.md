# An Bình Chemtech — Hệ thống Tự Động Hóa Tạo Báo Giá

> Prototype cho bài đánh giá năng lực Fresher/Junior AI Automation & Application Engineer.  
> Chứng minh luồng end-to-end từ hệ thống quản lý nội bộ → Mac mini Automation Node → Codex CLI → File báo giá hoàn chỉnh.

📄 Chi tiết phương án kiến trúc: **[SOLUTION_PLAN.md](./SOLUTION_PLAN.md)**

---

## Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu
- Node.js ≥ 18
- npm

### Khởi chạy nhanh

```bash
# 1. Cài đặt dependencies
npm run install:all

# 2. Khởi tạo Database + nạp dữ liệu mẫu (5 KH, 10 hóa chất)
npm run db:setup

# 3. Khởi chạy toàn bộ hệ thống (Server API + Client + Worker)
npm run dev
```

Truy cập giao diện: **http://localhost:5173**

### Chạy End-to-End Test

```bash
cd server && npx tsx src/test-flow.ts
```

Test tự động tạo 1 báo giá và kiểm tra toàn bộ luồng từ PENDING → COMPLETED → file XLSX trên disk.

---

## Luồng sử dụng (Demo)

1. **Trang chủ**: Xem danh sách khách hàng → Click vào 1 khách hàng
2. **Chi tiết KH**: Xem thông tin + lịch sử báo giá → Nhấn "Tạo báo giá"
3. **Form tạo BG**: Chọn hóa chất từ catalog, nhập số lượng/đơn giá/điều kiện → Nhấn "Gửi"
4. **Theo dõi**: Hệ thống chuyển sang trang chi tiết, hiển thị tiến trình 4 bước (PENDING → PROCESSING → COMPLETED)
5. **Tải file**: Khi hoàn tất, nhấn nút tải file `.xlsx` — file được tạo từ template mẫu có sẵn

---

## Cấu trúc dự án

```
anbinh-chemtech-test/
├── SOLUTION_PLAN.md              # Kế hoạch giải pháp kỹ thuật
├── README.md                     # Hướng dẫn & tổng quan
│
├── server/                       # Backend API + Mac mini Worker
│   ├── src/
│   │   ├── index.ts              # Express entry point
│   │   ├── routes/               # REST Controllers
│   │   ├── services/             # Business Logic Layer
│   │   ├── lib/
│   │   │   ├── worker.ts         # Mac mini Automation Worker (polling + retry)
│   │   │   ├── codex-cli.ts      # Codex CLI AI Service + fallback
│   │   │   ├── template-engine.ts # Đọc mẫu → Điền dữ liệu → Xuất XLSX
│   │   │   ├── create-template.ts # Tạo file mẫu quotation_template.xlsx
│   │   │   ├── validators.ts     # Zod schema validation
│   │   │   ├── logger.ts         # Structured JSON logger
│   │   │   └── utils.ts          # Shared utilities
│   │   ├── middleware/
│   │   │   └── rate-limiter.ts   # API rate limiting
│   │   └── test-flow.ts          # E2E test script
│   ├── templates/                # File mẫu báo giá có sẵn
│   │   └── quotation_template.xlsx
│   ├── output/                   # File báo giá XLSX đã sinh
│   └── prisma/
│       ├── schema.prisma         # Database schema
│       └── seed.ts               # Dữ liệu mẫu (KH, hóa chất)
│
└── client/                       # Frontend React SPA
    └── src/
        ├── App.tsx               # Routes + ErrorBoundary
        ├── components/           # Reusable components
        ├── pages/                # 5 pages (Customers, Detail, CreateQuotation, Quotations, QuotationDetail)
        ├── hooks/useAsyncData.ts # Custom hook cho data fetching
        ├── services/api.ts       # Centralized API client
        ├── utils/index.ts        # Shared utilities (formatDate, formatCurrency)
        └── index.css             # Design system (CSS variables, components)
```

---

## Phần đã hoàn thành

- ✅ **Luồng chính end-to-end**: Chọn KH → Tạo BG → Gửi → Mac mini xử lý → File XLSX hoàn chỉnh → Tải về
- ✅ **State Machine**: PENDING → PROCESSING → COMPLETED / FAILED, với real-time polling
- ✅ **Template Engine**: Đọc file mẫu `quotation_template.xlsx`, nhân bản, điền dữ liệu, xuất file
- ✅ **Codex CLI Service**: AI sinh thư ngỏ thương mại + khuyến cáo an toàn hóa chất, có fallback
- ✅ **Idempotency**: Chống gửi trùng lặp bằng client-generated key
- ✅ **Retry Policy**: Worker tự động thử lại tối đa 3 lần, có nút retry thủ công
- ✅ **Validation**: Zod schema trên cả API và form client
- ✅ **File mẫu báo giá**: 6 file XLSX mẫu đã sinh sẵn trong `server/output/`
- ✅ **E2E Test**: Script tự động kiểm tra toàn bộ luồng

## Phần đang mock / simulate

- **Mac mini**: Worker chạy cùng process với API server (cùng máy). Trong production, worker sẽ chạy trên Mac mini riêng biệt, kết nối qua DB hoặc message queue.
- **Codex CLI**: Sử dụng Simulated Intelligence (rule-based) thay vì gọi CLI thực. Code đã sẵn sàng cho tích hợp Codex CLI thật qua `child_process.exec`.
- **Authentication**: Không có (phù hợp với prototype nội bộ). Production: SSO + RBAC.

## Giả định

- Dữ liệu khách hàng và sản phẩm hoàn toàn giả lập (5 KH, 10 hóa chất)
- Thuế GTGT cố định 10%
- File đầu ra dạng XLSX (phù hợp với nghiệp vụ Excel hiện tại của doanh nghiệp)
- Giao diện ở mức đủ rõ ràng để demo luồng, không phải tiêu chí trọng tâm theo đề bài

## Công cụ AI đã sử dụng

- **Google Gemini (Antigravity IDE)**: Hỗ trợ phát triển code, thiết kế kiến trúc, viết test
- **Vai trò**: Công cụ hỗ trợ engineering — toàn bộ quyết định kiến trúc và code đều do ứng viên hiểu, kiểm soát và chịu trách nhiệm

## Nếu triển khai Production

1. Chuyển SQLite → **PostgreSQL** (concurrency, transaction mạnh hơn)
2. Thay DB Polling → **Redis BullMQ** để Mac mini nhận job qua event-driven queue
3. Lưu file trên **S3 / MinIO** với Presigned URLs có thời hạn
4. Tích hợp **SSO** (Google Workspace / Azure AD) + phân quyền RBAC
5. Thêm export **PDF** với chữ ký số và con dấu điện tử
