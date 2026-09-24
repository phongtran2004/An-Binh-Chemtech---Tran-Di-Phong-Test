import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { createMasterTemplate } from './create-template';
import { logger } from './logger';
import type { QuotationGenerateData } from '../types';

const TEMPLATE_PATH = path.resolve(__dirname, '../../templates/quotation_template.xlsx');
const OUTPUT_DIR = path.resolve(__dirname, '../../output');

/**
 * Template Engine - Implements An Bình Chemtech's requirement:
 * "Hệ thống sử dụng một file báo giá mẫu có sẵn, tạo bản làm việc phù hợp,
 * điền dữ liệu vào đúng vị trí và cuối cùng xuất ra file báo giá hoàn chỉnh."
 */
export async function generateQuotationFile(data: QuotationGenerateData): Promise<string> {
  // 1. Ensure master template exists
  if (!fs.existsSync(TEMPLATE_PATH)) {
    logger.template.warn('Master template not found. Generating default template...');
    await createMasterTemplate(TEMPLATE_PATH);
  }

  // 2. Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 3. Load master template (Bản làm việc sao chép từ mẫu)
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);

  const sheet = workbook.getWorksheet('BAO_GIA_MAU') || workbook.worksheets[0];
  if (!sheet) {
    throw new Error('Template worksheet not found in master template');
  }

  // 4. Fill metadata & customer information into exact template cells
  const issueDateStr = new Date(data.createdAt).toLocaleDateString('vi-VN');
  const validUntil = new Date(data.createdAt);
  validUntil.setDate(validUntil.getDate() + data.validityDays);
  const validUntilStr = validUntil.toLocaleDateString('vi-VN');

  // Replace placeholders in header & customer info
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (typeof cell.value === 'string') {
        let val = cell.value;
        val = val.replace('{{QUOTATION_NUMBER}}', data.quotationNumber);
        val = val.replace('{{ISSUE_DATE}}', issueDateStr);
        val = val.replace('{{VALID_UNTIL}}', validUntilStr);
        val = val.replace('{{CUSTOMER_NAME}}', data.customer.companyName);
        val = val.replace('{{CONTACT_PERSON}}', data.customer.contactPerson);
        val = val.replace('{{PHONE}}', data.customer.phone);
        val = val.replace('{{EMAIL}}', data.customer.email);
        val = val.replace('{{ADDRESS}}', data.customer.address);
        val = val.replace('{{TAX_CODE}}', data.customer.taxCode || '—');
        
        if (val.includes('{{AI_ADVISORY}}')) {
          const advisory = [
            data.commercialNote ? `• ${data.commercialNote}` : '',
            data.technicalAdvisory ? `• ${data.technicalAdvisory}` : '',
          ].filter(Boolean).join('\r\n');
          val = val.replace('{{AI_ADVISORY}}', advisory || 'Tiêu chuẩn chất lượng theo quy chuẩn An Bình Chemtech.');
        }

        cell.value = val;
      }
    });
  });

  // 5. Fill Table Rows starting from Row 19 (replacing placeholder row or appending)
  // Let's locate the row containing {{ITEM_STT}} or row 19
  let itemStartRowIndex = 19;
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const firstCellVal = String(row.getCell(1).value || '');
    if (firstCellVal.includes('{{ITEM_STT}}')) {
      itemStartRowIndex = r;
      break;
    }
  }

  // Clear the placeholder row
  const startRow = itemStartRowIndex;
  let totalAmount = 0;

  // Insert items
  data.items.forEach((item, index) => {
    const currentRowNumber = startRow + index;
    const row = sheet.getRow(currentRowNumber);

    row.getCell(1).value = index + 1; // STT
    row.getCell(2).value = item.productName;
    row.getCell(3).value = item.specification || 'Theo tiêu chuẩn NSX';
    row.getCell(4).value = item.unit;
    row.getCell(5).value = item.quantity;
    row.getCell(6).value = item.unitPrice;
    row.getCell(7).value = item.discount > 0 ? `${item.discount}%` : '-';
    row.getCell(8).value = item.amount;

    totalAmount += item.amount;

    // Formatting & Borders
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(5).numFmt = '#,##0.##';
    row.getCell(6).numFmt = '#,##0';
    row.getCell(8).numFmt = '#,##0';

    const isEven = index % 2 === 1;
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Arial', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF7FAFC' },
        };
      }
    }
    row.commit();
  });

  // 6. Append Summary Section (Subtotal, VAT, Grand Total)
  const afterItemsRow = startRow + data.items.length;
  sheet.addRow([]); // Blank spacer

  const vatRate = 0.1;
  const vatAmount = totalAmount * vatRate;
  const grandTotal = totalAmount + vatAmount;

  // Subtotal row
  const subtotalRow = sheet.addRow(['', '', '', '', '', '', 'Tổng tiền hàng:', totalAmount]);
  subtotalRow.getCell(7).font = { name: 'Arial', bold: true, size: 10 };
  subtotalRow.getCell(8).font = { name: 'Arial', bold: true, size: 10 };
  subtotalRow.getCell(8).numFmt = '#,##0';
  subtotalRow.getCell(8).alignment = { horizontal: 'right' };

  // VAT row
  const vatRow = sheet.addRow(['', '', '', '', '', '', 'Thuế GTGT (10%):', vatAmount]);
  vatRow.getCell(7).font = { name: 'Arial', size: 10 };
  vatRow.getCell(8).font = { name: 'Arial', size: 10 };
  vatRow.getCell(8).numFmt = '#,##0';
  vatRow.getCell(8).alignment = { horizontal: 'right' };

  // Grand total row
  const totalRow = sheet.addRow(['', '', '', '', '', '', 'TỔNG CỘNG (VNĐ):', grandTotal]);
  totalRow.getCell(7).font = { name: 'Arial', bold: true, size: 12, color: { argb: 'FF1A365D' } };
  totalRow.getCell(8).font = { name: 'Arial', bold: true, size: 12, color: { argb: 'FF2B6CB0' } };
  totalRow.getCell(8).numFmt = '#,##0';
  totalRow.getCell(8).alignment = { horizontal: 'right' };
  totalRow.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF8FF' } };
  totalRow.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF8FF' } };

  // 7. Terms & Conditions
  sheet.addRow([]);
  const termsTitle = sheet.addRow(['ĐIỀU KHOẢN VÀ ĐIỀU KIỆN THƯƠNG MẠI']);
  sheet.mergeCells(`A${termsTitle.number}:H${termsTitle.number}`);
  termsTitle.getCell(1).font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF1A365D' } };

  const pRow = sheet.addRow([`1. Thanh toán: ${data.paymentTerms}`]);
  sheet.mergeCells(`A${pRow.number}:H${pRow.number}`);
  pRow.getCell(1).font = { name: 'Arial', size: 9.5 };

  const dRow = sheet.addRow([`2. Giao hàng: ${data.deliveryTerms}`]);
  sheet.mergeCells(`A${dRow.number}:H${dRow.number}`);
  dRow.getCell(1).font = { name: 'Arial', size: 9.5 };

  if (data.notes) {
    const nRow = sheet.addRow([`3. Ghi chú khác: ${data.notes}`]);
    sheet.mergeCells(`A${nRow.number}:H${nRow.number}`);
    nRow.getCell(1).font = { name: 'Arial', size: 9.5 };
  }

  // 8. Sign-off block
  sheet.addRow([]);
  sheet.addRow([]);
  const signHeaderRow = sheet.addRow(['ĐẠI DIỆN KHÁCH HÀNG', '', '', '', '', 'ĐẠI DIỆN AN BÌNH CHEMTECH']);
  sheet.mergeCells(`A${signHeaderRow.number}:C${signHeaderRow.number}`);
  sheet.mergeCells(`F${signHeaderRow.number}:H${signHeaderRow.number}`);
  signHeaderRow.getCell(1).font = { name: 'Arial', bold: true, size: 10 };
  signHeaderRow.getCell(1).alignment = { horizontal: 'center' };
  signHeaderRow.getCell(6).font = { name: 'Arial', bold: true, size: 10, color: { argb: 'FF1A365D' } };
  signHeaderRow.getCell(6).alignment = { horizontal: 'center' };

  const signNoteRow = sheet.addRow(['(Ký, ghi rõ họ tên)', '', '', '', '', '(Ký, đóng dấu xác nhận)']);
  sheet.mergeCells(`A${signNoteRow.number}:C${signNoteRow.number}`);
  sheet.mergeCells(`F${signNoteRow.number}:H${signNoteRow.number}`);
  signNoteRow.getCell(1).font = { name: 'Arial', italic: true, size: 9, color: { argb: 'FF718096' } };
  signNoteRow.getCell(1).alignment = { horizontal: 'center' };
  signNoteRow.getCell(6).font = { name: 'Arial', italic: true, size: 9, color: { argb: 'FF718096' } };
  signNoteRow.getCell(6).alignment = { horizontal: 'center' };

  // 9. Save final quotation file
  const fileName = `${data.quotationNumber}.xlsx`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await workbook.xlsx.writeFile(filePath);
  logger.template.info('Generated quotation file from master template', { filePath });

  return filePath;
}
