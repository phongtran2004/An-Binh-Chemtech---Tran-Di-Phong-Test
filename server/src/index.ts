import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import customerRoutes from './routes/customers';
import quotationRoutes from './routes/quotations';
import productRoutes from './routes/products';
import { startWorker, stopWorker, getWorkerStatus } from './lib/worker';
import { rateLimiter } from './middleware/rate-limiter';
import { logger } from './lib/logger';

/**
 * An Bình Chemtech - Enterprise Quotation API Server
 * 
 * Architecture:
 * - Express.js REST API (Thin controllers -> Domain Services -> Prisma DB)
 * - Mac mini Automation Node Worker (Background polling & execution)
 * - Deterministic Financial Core + Codex CLI Contextual Enrichment
 */

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting — prevents abuse on all API endpoints
app.use('/api', rateLimiter({ windowMs: 60_000, maxRequests: 120 }));

// Business Routes
app.use('/api/customers', customerRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/products', productRoutes);

// Mac mini Node Telemetry & Health check
app.get('/api/worker/status', (_req, res) => {
  res.json({ data: getWorkerStatus() });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'An Bình Chemtech Quotation System',
    timestamp: new Date().toISOString(),
    worker: getWorkerStatus(),
  });
});

// Start Server
const server = app.listen(PORT, () => {
  logger.system.info('======================================================');
  logger.system.info('🏭 AN BÌNH CHEMTECH - HỆ THỐNG TẠO BÁO GIÁ TỰ ĐỘNG');
  logger.system.info(`📡 API Server: http://localhost:${PORT}`);
  logger.system.info(`📋 Health Check: http://localhost:${PORT}/api/health`);
  logger.system.info('🖥️  Worker Node: Mac mini Automation Node (Active)');
  logger.system.info('======================================================');

  // Start the background worker (Simulating Mac mini)
  startWorker();
});

// Graceful shutdown
const shutdown = () => {
  logger.system.info('Đang dừng hệ thống an toàn...');
  stopWorker();
  server.close(() => {
    logger.system.info('Server đã đóng kết nối.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
