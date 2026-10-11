# 🎯 ÔN PHỎNG VẤN — AN BÌNH CHEMTECH
> Trần Di Phong | 10:00 sáng 12/10/2026 | Fresher/Junior AI Automation & Application Engineer

---

## ⚡ TOP 5 CÂU CHẮC CHẮN RA — PHẢI THUỘC LÒNG

### 1. "Tóm tắt bài test em đã làm"
> Hệ thống tự động tạo báo giá. Em xây 2 phần:
> - **Web** (React + TypeScript): Nhân viên nhập thông tin khách hàng, sản phẩm, giá → bấm Gửi.
> - **Worker Node** (mô phỏng Mac mini): Tiến trình nền polling DB mỗi 2 giây → nhặt đơn PENDING → gọi AI sinh lời chào + khuyến cáo an toàn hóa chất → điền vào Excel mẫu → xuất file XLSX.
>
> Luồng trạng thái: **PENDING → PROCESSING → COMPLETED**. Người dùng theo dõi realtime, tải file về khi xong.

---

### 2. "Tại sao dùng Async thay vì trả kết quả đồng bộ?"
> 3 lý do:
> 1. Mac mini có thể offline bất cứ lúc nào — async giữ đơn PENDING, worker bật lại tự xử lý tiếp.
> 2. Render Excel + gọi AI mất 2-3 giây — HTTP đồng bộ dễ timeout.
> 3. Scale sau này: gắn nhiều worker mà không sửa code web.

---

### 3. "AI vs Code xác định — em phân định thế nào?"
> - **Code xác định**: Tất cả tính toán tài chính (đơn giá, VAT, tổng tiền) — không để AI hallucinate số tiền.
> - **AI (Codex CLI)**: Chỉ sinh văn bản linh hoạt — lời chào thương mại, khuyến cáo an toàn hóa chất.
> - **Fallback**: Nếu AI lỗi → rule-based: tên có "axit/HCl" → in cảnh báo ăn mòn. Hệ thống không bao giờ dừng.

---

### 4. "Bài tập PowerPoint — em đã chuẩn bị gì?"
> Đã đọc kỹ file README, mở file `.pptx` phân tích cấu trúc. Công ty dùng 2 cơ chế nhận diện:
> - Placeholder `[]` trong nội dung ô.
> - Tên shape dạng `txt_*` trong Selection Pane.
>
> Em đã viết Python script dùng `python-pptx` để điền chính xác từng ô theo `shape.name`. Demo chạy được ngay trên máy. Phần AI agent trong demo đang **mô phỏng** — em có kế hoạch tích hợp LLM thật qua API.

---

### 5. "Tailscale là gì? Tại sao dùng?"
> Mesh VPN dựa trên WireGuard. Mini PC ở văn phòng không có IP Public, nằm sau NAT. Tailscale gán IP ảo tĩnh (100.x.y.z) cho cả server Laravel lẫn Mini PC — 2 thiết bị thấy nhau, mã hóa đầu cuối, không cần mở port router.

---

## 📋 NHÓM CÂU HỎI KỸ THUẬT — BÀI TEST CŨ

| Câu hỏi | Từ khóa trả lời |
|:---|:---|
| Atomic Claim là gì? | `updateMany` nguyên tử, chống race condition, 2 worker không xử lý trùng |
| Idempotency Key? | Key duy nhất per request, `@unique` trong DB, bấm Gửi nhiều lần = 1 đơn |
| Retry Policy? | Lần 1-2 lỗi → PENDING lại, lần 3 → FAILED, UI có nút Retry thủ công |
| Tại sao dùng Prisma? | Type-safe, schema 1 nơi, đổi SQLite→PostgreSQL chỉ 1 dòng config |
| Polling vs WebSocket? | Polling: đơn giản, lãng phí. WebSocket: realtime, cần giữ connection. SSE: 1 chiều, phù hợp hơn cho case này |
| N+1 Query là gì? | Eloquent lazy load, dùng `with()` để eager load, tránh query trong vòng lặp |
| Rate Limiter nội bộ làm gì? | Chống bug loop, chống máy nhiễm malware, giới hạn tải worker |

---

## 📋 NHÓM CÂU HỎI — POWERPOINT TASK MỚI

| Câu hỏi | Từ khóa trả lời |
|:---|:---|
| Tại sao python-pptx? | Đọc `shape.name`, giữ nguyên font/màu/format, nhẹ, nhanh <100ms |
| AI agent làm gì trong demo? | Đang mock. Kế hoạch thật: LLM nhận placeholder list + data → trả JSON mapping → Python điền |
| Tại sao không để AI điền số tiền? | Hallucination. Tiền bạc phải chính xác tuyệt đối |
| Phần nào thật, phần nào mô phỏng? | Thật: Python script điền PPTX, xuất file. Mock: phần gọi AI, phần nhận request từ Laravel qua Tailscale |

---

## 📋 NHÓM CÂU HỎI — AI & CÔNG NGHỆ TỔNG QUÁT

| Câu hỏi | Từ khóa trả lời |
|:---|:---|
| Hallucination là gì? | AI bịa thông tin có vẻ đúng. Nguy hiểm: sai số tiền, sai thông số kỹ thuật MSDS |
| RAG là gì? | Retrieval-Augmented Generation. Chunk tài liệu → embed → vector DB → semantic search → ghép vào prompt → LLM trả lời chính xác |
| Prompt Engineering? | Role prompting, structured output (JSON), fallback instruction |
| WebSocket vs Socket.IO? | WebSocket: giao thức chuẩn, tự xử lý hết. Socket.IO: thư viện bọc bên trên, thêm rooms/auto-reconnect/fallback |
| RBAC là gì? | Phân quyền theo vai trò. Nhân viên KD chỉ xem đơn của mình. Manager xem toàn team |

---

## 📋 NHÓM CÂU HỎI — LARAVEL & STACK CÔNG TY

| Câu hỏi | Từ khóa trả lời |
|:---|:---|
| Chưa làm Laravel, em có lo không? | Thành thật: có chút lo. Nhưng đã qua nhiều framework — tư duy MVC giống nhau, syntax học được nhanh |
| Eloquent vs Prisma? | Eloquent: PHP, dynamic, lazy load mặc định. Prisma: TypeScript, type-safe, explicit include |
| Inertia React là gì? | Cầu nối Laravel backend + React frontend mà không cần viết API riêng. Giống Next.js server-side rendering nhưng dùng Laravel làm server |
| Tại sao dùng Astro cho website? | Static HTML → SEO tốt, Core Web Vitals cao, Cloudflare CDN toàn cầu, Zero JS mặc định |
| Cloudflare Pages? | Deploy static site, CDN toàn cầu, miễn phí cho dự án nhỏ, tích hợp CI/CD qua GitHub |

---

## 📋 NHÓM CÂU HỎI — TỪ CV

| Câu hỏi | Từ khóa trả lời |
|:---|:---|
| TaskSpace dùng AI thế nào? | Gemini API summarize thread chat, tóm tắt quyết định + action items theo prompt có cấu trúc |
| RBAC trong Agent4PM/TaskSpace? | Auth Guard Middleware, JWT, role kiểm tra per endpoint, cache giảm DB latency |
| Hackathon Top 3 học được gì? | MVP trước, phân chia theo strength, demo quan trọng như code |
| TMA Solutions làm gì? | Agent4PM: AI cho quản lý dự án. RBAC, caching, Kanban, analytics dashboard |
| WebSocket SockJS/STOMP vs Socket.IO? | SockJS: fallback tự động khi browser không hỗ trợ. STOMP: protocol message trên Spring — định nghĩa channel `/topic/room-123` thay vì quản lý socket thủ công |

---

## 📋 NHÓM CÂU HỎI — TÌNH HUỐNG & SOFT SKILLS

| Câu hỏi | Cách trả lời |
|:---|:---|
| Debug: đơn xử lý 1 tiếng chưa xong? | Kiểm tra status DB → worker health/heartbeat → log lỗi → retry thủ công |
| Tuần đầu onboard làm gì? | Đọc README, trace 1 luồng nghiệp vụ đầu-cuối, hỏi mentor thay vì đoán mò |
| Điểm yếu của bài test? | UI đơn giản (ưu tiên workflow), chưa có unit test per function |
| Nếu làm lại? | Thêm SQLite trigger hoặc tách endpoint submit/save, thêm Zod validate ở client |
| Laravel thiếu kinh nghiệm? | AI automation task làm được ngay. Laravel cụ thể: cam kết 1-2 tuần với mentor |

---

## ❓ 3 CÂU HỎI BẠN HỎI LẠI CÔNG TY

> 1. *"Task cụ thể trong tháng đầu tiên của vị trí này là gì ạ?"*
> 2. *"Team kỹ thuật hiện tại có bao nhiêu người và cách phân công như thế nào ạ?"*
> 3. *"Roadmap tích hợp AI vào hệ thống trong 6-12 tháng tới là gì ạ?"*

---

## 🚀 CHECKLIST SÁNG TRƯỚC KHI ĐI

- [ ] Chạy `npm run dev` → mở `http://localhost:5173` → test tạo 1 báo giá
- [ ] Mở sẵn `powerpoint_automation.py` trong VS Code
- [ ] Mở sẵn `POWERPOINT_SOLUTION.md`
- [ ] Terminal sẵn sàng gõ `python powerpoint_automation.py`
- [ ] File `01_Bao_Gia_An_Binh_Chemtech_DEMO.pptx` đã mở sẵn
- [ ] In CV
- [ ] Sạc laptop đầy

---

## 💡 5 NGUYÊN TẮC KHI VÀO PHÒNG

1. **Tự tin** — Nói chậm, rõ ràng, nhìn vào mắt người hỏi
2. **Cấu trúc** — Mở đầu 1 câu tóm tắt, sau đó giải thích
3. **Chủ động demo** — *"Nếu anh muốn em có thể chạy thử ngay ạ"*
4. **Thành thật** — Không giấu phần mock, không giả vờ biết Laravel
5. **Kết nối với công việc thực tế** — Luôn liên hệ câu trả lời về nghiệp vụ thực của An Bình Chemtech
