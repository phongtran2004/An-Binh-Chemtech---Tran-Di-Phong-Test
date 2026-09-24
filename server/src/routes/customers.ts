import { Router, Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/customers - List all customers
router.get('/', async (_req: Request, res: Response) => {
  try {
    const customers = await CustomerService.listAll();
    res.json({ data: customers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.api.error('Error fetching customers', { error: msg });
    res.status(500).json({ error: 'Không thể tải danh sách khách hàng' });
  }
});

// GET /api/customers/:id - Customer detail + quotation history
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'ID khách hàng không hợp lệ' });
    }

    const customer = await CustomerService.getById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
    }

    res.json({ data: customer });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.api.error('Error fetching customer detail', { error: msg });
    res.status(500).json({ error: 'Không thể tải thông tin khách hàng' });
  }
});

export default router;
