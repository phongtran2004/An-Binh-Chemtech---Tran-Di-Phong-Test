import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

/**
 * Script to generate the official An Bình Chemtech Excel Master Template.
 * This template serves as the pre-existing file ("mẫu file báo giá có sẵn")
 * required by the An Bình Chemtech technical assessment.
 */
export async function createMasterTemplate(outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'An Bình Chemtech Enterprise System';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date('2026-01-01');
  workbook.properties.date1904 = true;

  const sheet = workbook.addWorksheet('BAO_GIA_MAU', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      margins: {
        left: 0.6,
        right: 0.6,
        top: 0.7,
        bottom: 0.7,
        header: 0.3,
        footer: 0.3,
      },
    },
  });

  // Column definitions & widths
  sheet.columns = [
    { key: 'colA', width: 6 },   // STT
    { key: 'colB', width: 28 },  // Tên sản phẩm
    { key: 'colC', width: 22 },  // Quy cách
    { key: 'colD', width: 10 },  // ĐVT
    { key: 'colE', width: 12 },  // Số lượng
    { key: 'colF', width: 18 },  // Đơn giá
    { key: 'colG', width: 10 },  // CK %
    { key: 'colH', width: 20 },  // Thành tiền
  ];

  // Header Brand
  const r1 = sheet.addRow(['CÔNG TY CỔ PHẦN HÓA CHẤT AN BÌNH (AN BINH CHEMTECH)']);
  sheet.mergeCells(`A1:H1`);
  r1.getCell(1).font = { name: 'Arial', bold: true, size: 14, color: { argb: 'FF1A365D' } };
  r1.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  r1.height = 25;

  const r2 = sheet.addRow(['KCN Đình Vũ, Hải Phòng | Hotline: (+84) 225 388 9966 | Website: www.anbinhchemtech.vn']);
  sheet.mergeCells(`A2:H2`);
  r2.getCell(1).font = { name: 'Arial', italic: true, size: 9, color: { argb: 'FF4A5568' } };
  r2.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.addRow([]); // Blank line 3

  // Document Title
  const r4 = sheet.addRow(['BÁO GIÁ THƯƠNG MẠI']);
  sheet.mergeCells(`A4:H4`);
  r4.getCell(1).font = { name: 'Arial', bold: true, size: 16, color: { argb: 'FF2B6CB0' } };
  r4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r4.height = 30;

  const r5 = sheet.addRow(['COMMERCIAL QUOTATION & TECHNICAL SPECIFICATION']);
  sheet.mergeCells(`A5:H5`);
  r5.getCell(1).font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF718096' } };
  r5.getCell(1).alignment = { horizontal: 'center' };

  sheet.addRow([]); // Blank line 6

  // Meta Information Box
  const r7 = sheet.addRow(['Số báo giá:', '{{QUOTATION_NUMBER}}', '', '', 'Ngày lập:', '{{ISSUE_DATE}}']);
  r7.getCell(1).font = { name: 'Arial', bold: true, size: 10 };
  r7.getCell(2).font = { name: 'Arial', bold: true, color: { argb: 'FF2B6CB0' } };
  r7.getCell(5).font = { name: 'Arial', bold: true, size: 10 };
  sheet.mergeCells('B7:D7');
  sheet.mergeCells('F7:H7');

  const r8 = sheet.addRow(['Đơn vị tiền tệ:', 'VNĐ (Việt Nam Đồng)', '', '', 'Hiệu lực đến:', '{{VALID_UNTIL}}']);
  r8.getCell(1).font = { name: 'Arial', bold: true, size: 10 };
  r8.getCell(5).font = { name: 'Arial', bold: true, size: 10 };
  sheet.mergeCells('B8:D8');
  sheet.mergeCells('F8:H8');

  sheet.addRow([]); // Blank line 9

  // Customer Information Header
  const r10 = sheet.addRow(['THÔNG TIN KHÁCH HÀNG / CUSTOMER DETAILS']);
  sheet.mergeCells('A10:H10');
  r10.getCell(1).font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF1A365D' } };
  r10.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF8FF' } };

  const r11 = sheet.addRow(['Tên công ty:', '{{CUSTOMER_NAME}}']);
  r11.getCell(1).font = { name: 'Arial', bold: true, size: 10 };
  sheet.mergeCells('B11:H11');

  const r12 = sheet.addRow(['Người liên hệ:', '{{CONTACT_PERSON}}', '', '', 'Số điện thoại:', '{{PHONE}}']);
  r12.getCell(1).font = { name: 'Arial', bold: true, size: 10 };
  r12.getCell(5).font = { name: 'Arial', bold: true, size: 10 };
  sheet.mergeCells('B12:D12');
  sheet.mergeCells('F12:H12');

  const r13 = sheet.addRow(['Email:', '{{EMAIL}}', '', '', 'Mã số thuế:', '{{TAX_CODE}}']);
  r13.getCell(1).font = { name: 'Arial', bold: true, size: 10 };
  r13.getCell(5).font = { name: 'Arial', bold: true, size: 10 };
  sheet.mergeCells('B13:D13');
  sheet.mergeCells('F13:H13');

  const r14 = sheet.addRow(['Địa chỉ:', '{{ADDRESS}}']);
  r14.getCell(1).font = { name: 'Arial', bold: true, size: 10 };
  sheet.mergeCells('B14:H14');

  // AI-Assisted Chemical Advisory Banner
  const r15 = sheet.addRow(['Ghi chú kỹ thuật & Thư ngỏ:']);
  sheet.mergeCells('A15:H15');
  r15.getCell(1).font = { name: 'Arial', bold: true, italic: true, size: 9, color: { argb: 'FF2C5282' } };

  const r16 = sheet.addRow(['{{AI_ADVISORY}}']);
  sheet.mergeCells('A16:H16');
  r16.getCell(1).font = { name: 'Arial', italic: true, size: 9, color: { argb: 'FF4A5568' } };
  r16.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  r16.height = 36;

  sheet.addRow([]); // Blank line 17

  // Items Table Header (Row 18)
  const headerCols = [
    'STT',
    'Tên hóa chất / Sản phẩm',
    'Quy cách đóng gói / Hàm lượng',
    'ĐVT',
    'Số lượng',
    'Đơn giá (VNĐ)',
    'CK (%)',
    'Thành tiền (VNĐ)',
  ];
  const r18 = sheet.addRow(headerCols);
  r18.height = 26;
  r18.eachCell((cell) => {
    cell.font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E0' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E0' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E0' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E0' } },
    };
  });

  // Placeholder row 19 for item prototype
  const r19 = sheet.addRow(['{{ITEM_STT}}', '{{ITEM_NAME}}', '{{ITEM_SPEC}}', '{{ITEM_UNIT}}', 0, 0, 0, 0]);
  r19.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10 };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });

  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Master template created successfully at: ${outputPath}`);
}

// Allow direct CLI execution
if (require.main === module) {
  const defaultPath = path.resolve(__dirname, '../../templates/quotation_template.xlsx');
  createMasterTemplate(defaultPath).catch((err) => {
    console.error('Failed to create template:', err);
    process.exit(1);
  });
}
