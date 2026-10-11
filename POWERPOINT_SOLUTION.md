# AN BÌNH CHEMTECH — PHƯƠNG ÁN TỰ ĐỘNG HÓA TẠO BÁO GIÁ POWERPOINT

> **Tài liệu chuẩn bị cho bài tập nhỏ "Tạo tài liệu"**  
> Ứng viên: Trần Di Phong  
> Vị trí: Fresher/Junior AI Automation & Application Engineer

---

## 1. TỔNG QUAN YÊU CẦU BÀI TẬP

- **Hệ thống nguồn:** Hệ thống quản lý nội bộ Laravel (PHP) + Inertia React + PostgreSQL.
- **Tài liệu mẫu:** `01_Bao_Gia_An_Binh_Chemtech.V2.pptx`.
- **Cơ chế nhận diện:** Các trường thông tin được đánh dấu bằng `[]` và đối tượng đặt tên dạng `txt_*` trong Selection Pane.
- **Môi trường kết nối:** Mạng riêng ảo Tailscale (kết nối máy chủ Laravel Cloud với Thiết bị thực thi / Mini PC tại văn phòng).

---

## 2. KIẾN TRÚC GIẢI PHÁP TỔNG THỂ

```
┌─────────────────────────────────┐
│     HỆ THỐNG LARAVEL NỘI BỘ     │
│   (Inertia React + PostgreSQL)  │
│                                 │
│   Người dùng nhập báo giá:      │
│   • Sản phẩm A: 123.000 VNĐ     │
│   • Sản phẩm B: 345.000 VNĐ     │
│                                 │
│   Bấm "Tạo báo giá PPTX"        │
└────────────────┬────────────────┘
                 │
                 │ HTTP POST Payload (JSON)
                 │ qua mạng Tailscale IP (100.x.y.z:8000)
                 ▼
┌────────────────────────────────────────────────────────┐
│        THIẾT BỊ THỰC THI (Mini PC / Mac mini)          │
│                                                        │
│   FastAPI / Python Automation Service:                 │
│                                                        │
│   1. Nhận Payload từ Laravel                           │
│   2. Nạp template: 01_Bao_Gia_An_Binh_Chemtech.V2.pptx │
│   3. Quét Selection Pane (txt_*) & Thay thế []         │
│   4. Giữ nguyên 100% định dạng, màu sắc, font chữ      │
│   5. Xuất file: Bao_Gia_Hoan_Chinh.pptx                │
└────────────────┬───────────────────────────────────────┘
                 │
                 │ File URL / Trả về kết quả
                 ▼
┌─────────────────────────────────┐
│   TẢI VỀ HOẶC GỬI CHO KHÁCH     │
│   (PPTX hoặc chuyển đổi sang PDF│
│    có chữ ký số công ty)        │
└─────────────────────────────────┘
```

---

## 3. CÁC QUYẾT ĐỊNH KỸ THUẬT QUAN TRỌNG

### 3.1 Tại sao dùng Mạng Tailscale?
- Thiết bị thực thi (Mini PC / Mac mini) đặt tại văn phòng An Bình Chemtech thường nằm sau router/NAT, **không có địa chỉ IP Public**.
- Tailscale tạo một mạng riêng ảo bảo mật ngang hàng (Peer-to-Peer Mesh VPN dựa trên WireGuard).
- Server Laravel (Cloud) và Mini PC (Văn phòng) giao tiếp trực tiếp qua địa chỉ IP tĩnh ảo 100.x.y.z mã hóa đầu cuối mà **không cần mở port router**, đảm bảo an toàn tuyệt đối cho dữ liệu doanh nghiệp.

### 3.2 Tại sao chọn thư viện `python-pptx`?
- **Khả năng giữ nguyên định dạng (Preserve Styling):** Không làm vỡ layout, font chữ hay màu nhận diện thương hiệu của An Bình Chemtech.
- **Hỗ trợ Selection Pane:** Đọc trực tiếp `shape.name` để tìm đúng `txt_*` thay vì phụ thuộc vào tọa độ (x, y) dễ bị lệch khi thay đổi kích thước slide.
- **Hiệu năng cao:** Xử lý render xong 1 slide PowerPoint chỉ mất **dưới 100ms**.

### 3.3 Vai trò của AI Agent trong bài toán này:
- **Xác định rõ vai trò:** Giá tiền và số lượng sản phẩm được điền **chính xác 100% bằng code**.
- **AI Agent (Codex/LLM):** Đảm nhiệm việc sinh lời mở đầu thư chào hàng cá nhân hóa, hoặc tóm tắt khuyến cáo an toàn kỹ thuật của hóa chất nếu khách hàng có yêu cầu đặc thù.

---

## 4. HƯỚNG MỞ RỘNG PRODUCTION
1. **Xuất PDF tự động:** Sử dụng LibreOffice headless (`soffice --headless --convert-to pdf`) trên Mini PC để chuyển đổi file PPTX sang PDF chất lượng cao.
2. **Hàng đợi chống nghẽn:** Sử dụng Redis Queue để xử lý tuần tự nếu nhiều nhân viên kinh doanh cùng tạo báo giá cùng lúc.
