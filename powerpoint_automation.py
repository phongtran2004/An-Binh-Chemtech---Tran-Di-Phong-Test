import os
import sys
from pptx import Presentation

# Thiết lập encoding UTF-8 cho console tiếng Việt
sys.stdout.reconfigure(encoding='utf-8')

"""
AN BÌNH CHEMTECH - POWERPOINT QUOTATION AUTOMATION AGENT
Chức năng:
1. Tiếp nhận payload báo giá từ hệ thống Laravel nội bộ (qua mạng Tailscale).
2. Nạp mẫu '01_Bao_Gia_An_Binh_Chemtech.V2.pptx'.
3. Quét từng ô văn bản (Shape ID / Run) chính xác, không nhầm lẫn.
4. Tự động tính toán đơn giá có thuế VAT 10% nếu hệ thống chưa tính sẵn.
5. Xuất ra file PowerPoint báo giá hoàn chỉnh 100% thẩm mỹ, không vỡ định dạng.
"""

def generate_powerpoint_quotation(template_path: str, output_path: str, data: dict):
    print("=" * 65)
    print("🚀 BẮT ĐẦU TIẾN TRÌNH TỰ ĐỘNG ĐIỀN BÁO GIÁ POWERPOINT")
    print(f"📂 File mẫu: {template_path}")
    print("=" * 65)

    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Không tìm thấy file mẫu tại: {template_path}")

    prs = Presentation(template_path)
    slide = prs.slides[0]

    # Tính toán giá tiền và thuế cho 3 sản phẩm
    p1_price_ex = data.get('p1_price', 52000)
    p1_price_inc = int(p1_price_ex * 1.1)

    p2_price_ex = data.get('p2_price', 48500)
    p2_price_inc = int(p2_price_ex * 1.1)

    p3_price_ex = data.get('p3_price', 55000)
    p3_price_inc = int(p3_price_ex * 1.1)

    # Bản đồ cập nhật chính xác theo Shape ID và vị trí
    # Điều này đảm bảo KHÔNG BAO GIỜ bị nhầm lẫn giữa tên khách hàng và ngày tháng
    updates_by_shape_id = {
        # Khách hàng
        20: lambda text: text.replace('[…]', data.get('customer_name', 'CÔNG TY CỔ PHẦN CHẾ BIẾN THỰC PHẨM HẢI PHÒNG')),
        # Sản phẩm 1
        28: lambda text: text.replace('[Tetrasodium Pyrophosphate (TSPP)]', data.get('p1_name', 'Phụ gia TSPP (Tetrasodium Pyrophosphate) - Food Grade')),
        29: lambda text: f"{p1_price_ex:,}",
        30: lambda text: f"{p1_price_inc:,}",
        # Sản phẩm 2
        32: lambda text: text.replace('[Sodium Tripolyphosphate (STPP)]', data.get('p2_name', 'Phụ gia STPP (Sodium Tripolyphosphate) - Nhập Khẩu')),
        33: lambda text: f"{p2_price_ex:,}",
        34: lambda text: f"{p2_price_inc:,}",
        # Sản phẩm 3
        36: lambda text: text.replace('[Sodium Hexametaphosphate (SHMP)]', data.get('p3_name', 'Phụ gia SHMP (Sodium Hexametaphosphate) - Chế Biến')),
        37: lambda text: f"{p3_price_ex:,}",
        38: lambda text: f"{p3_price_inc:,}",
        # Ngày lập báo giá
        42: lambda text: f"Ngày {data.get('day', '12')} tháng {data.get('month', '10')} năm {data.get('year', '2026')}",
        # Số hiệu báo giá
        46: lambda text: data.get('quotation_code', 'ABC-HP/QT/2610/01'),
    }

    modified_count = 0

    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue

        if shape.shape_id in updates_by_shape_id:
            formatter = updates_by_shape_id[shape.shape_id]
            
            # Cập nhật trực tiếp text run đầu tiên để giữ nguyên font chữ, cỡ chữ, màu sắc
            paragraphs = shape.text_frame.paragraphs
            if paragraphs and paragraphs[0].runs:
                # Nếu shape có nhiều runs, xử lý run đầu và xóa run thừa để tránh lặp
                first_run = paragraphs[0].runs[0]
                old_text = shape.text.strip()
                new_text = formatter(old_text)
                
                # Gán vào run đầu tiên
                first_run.text = new_text
                
                # Xóa text ở các run sau nếu có
                for r in paragraphs[0].runs[1:]:
                    r.text = ""
                for p in paragraphs[1:]:
                    for r in p.runs:
                        r.text = ""

                print(f"✓ Shape ID {shape.shape_id:2d} [{shape.name}]: '{old_text}' ➔ '{new_text}'")
                modified_count += 1

    # Lưu file kết quả
    prs.save(output_path)
    print("=" * 65)
    print(f"🎉 HOÀN TẤT! Đã điền thành công {modified_count} vị trí.")
    print(f"💾 File báo giá hoàn chỉnh đã lưu tại:\n   -> {output_path}")
    print("=" * 65)
    return output_path

if __name__ == '__main__':
    # Payload giả lập từ hệ thống Laravel gửi qua Tailscale
    payload_from_laravel = {
        'customer_name': 'CÔNG TY CỔ PHẦN CHẾ BIẾN THỰC PHẨM HẢI PHÒNG',
        'p1_name': 'Phụ gia TSPP (Tetrasodium Pyrophosphate) - Food Grade',
        'p1_price': 52000,
        'p2_name': 'Phụ gia STPP (Sodium Tripolyphosphate) - Nhập Khẩu',
        'p2_price': 48500,
        'p3_name': 'Phụ gia SHMP (Sodium Hexametaphosphate) - Chế Biến Thủy Sản',
        'p3_price': 55000,
        'day': '12',
        'month': '10',
        'year': '2026',
        'quotation_code': 'ABC-HP/QT/2610/01',
    }

    template_file = r"F:\anbinh-interview\01_Bao_Gia_An_Binh_Chemtech.V2.pptx"
    output_file = r"F:\anbinh-interview\01_Bao_Gia_An_Binh_Chemtech_DEMO.pptx"

    generate_powerpoint_quotation(template_file, output_file, payload_from_laravel)
