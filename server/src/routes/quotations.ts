import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { QuotationService } from '../services/quotation.service';
import { createQuotationSchema } from '../lib/validators';
import { logger } from '../lib/logger';

const router = Router();

// Helper for type-safe route params in Express 5
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

// GET /api/quotations - List all quotations
router.get('/', async (_req: Request, res: Response) => {
  try {
    const quotations = await QuotationService.listAll();
    res.json({ data: quotations });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.api.error('Error fetching quotations', { error: msg });
    res.status(500).json({ error: 'Không thể tải danh sách báo giá' });
  }
});

// GET /api/quotations/:id - Quotation details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'ID báo giá không hợp lệ' });
    }

    const quotation = await QuotationService.getById(id);
    if (!quotation) {
      return res.status(404).json({ error: 'Không tìm thấy báo giá' });
    }

    res.json({ data: quotation });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.api.error('Error fetching quotation', { error: msg });
    res.status(500).json({ error: 'Không thể tải thông tin báo giá' });
  }
});

// POST /api/quotations - Create new quotation
router.post('/', async (req: Request, res: Response) => {
  try {
    // 1. Zod runtime validation
    const parseResult = createQuotationSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const input = parseResult.data;

    // 2. Idempotency Check (Prevent duplicate submissions)
    if (input.idempotencyKey) {
      const existing = await QuotationService.checkIdempotency(input.idempotencyKey);
      if (existing) {
        return res.status(200).json({
          data: existing,
          message: 'Báo giá đã được tạo trước đó (Idempotent replay)',
        });
      }
    }

    // 3. Create Quotation (Queued as PENDING for Mac mini worker)
    const quotation = await QuotationService.create(input);
    logger.api.info('Quotation created', {
      id: quotation.id,
      number: quotation.quotationNumber,
    });
    res.status(201).json({ data: quotation });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.api.error('Error creating quotation', { error: msg });

    if (msg === 'CUSTOMER_NOT_FOUND') {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng đã chọn' });
    }
    res.status(500).json({ error: 'Không thể tạo báo giá' });
  }
});

// POST /api/quotations/:id/retry - Retry a failed quotation
router.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'ID báo giá không hợp lệ' });
    }

    const updated = await QuotationService.retry(id);
    logger.api.info('Quotation retry queued', { id });
    res.json({ data: updated });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.api.error('Error retrying quotation', { error: msg });

    if (msg === 'QUOTATION_NOT_FOUND') {
      return res.status(404).json({ error: 'Không tìm thấy báo giá' });
    }
    if (msg === 'INVALID_STATUS_FOR_RETRY') {
      return res.status(400).json({ error: 'Chỉ có thể thử lại các báo giá ở trạng thái LỖI (FAILED)' });
    }
    res.status(500).json({ error: 'Không thể thử lại tác vụ' });
  }
});

// GET /api/quotations/:id/download - Download finalized quotation XLSX file
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const quotation = await QuotationService.getById(id);

    if (!quotation) {
      return res.status(404).json({ error: 'Không tìm thấy báo giá' });
    }
    if (quotation.status !== 'COMPLETED' || !quotation.filePath) {
      return res.status(400).json({ error: 'File báo giá chưa sẵn sàng để tải xuống' });
    }

    if (!fs.existsSync(quotation.filePath)) {
      return res.status(404).json({ error: 'File báo giá không tồn tại trên hệ thống lưu trữ' });
    }

    const fileName = `${quotation.quotationNumber}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(path.resolve(quotation.filePath));
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.api.error('Error downloading quotation file', { error: msg });
    res.status(500).json({ error: 'Không thể tải file báo giá' });
  }
});

export default router;
