import { Router, Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/products - List all chemical catalog products
router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await ProductService.listAll();
    res.json({ data: products });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.api.error('Error fetching products', { error: msg });
    res.status(500).json({ error: 'Không thể tải danh mục sản phẩm' });
  }
});

export default router;
