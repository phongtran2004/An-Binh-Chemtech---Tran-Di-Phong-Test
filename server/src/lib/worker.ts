import { prisma } from './db';
import { generateQuotationFile } from './template-engine';
import { CodexCliService } from './codex-cli';
import { sleep } from './utils';
import { logger } from './logger';
import type { WorkerStatusInfo } from '../types';

/**
 * Worker Service - Mac mini Automation Node.
 * 
 * Simulates the dedicated Mac mini node specified in the An Bình Chemtech workflow:
 * "Dữ liệu khách hàng cùng dữ liệu báo giá phải được chuyển sang một Mac mini
 * dùng cho tác vụ tự động hóa. Tại đây, Codex CLI nhận yêu cầu tạo báo giá
 * và tham gia vào quá trình xử lý..."
 */

const MAX_RETRIES = 3;
const POLL_INTERVAL_MS = 2000;
const PROCESSING_DELAY_MS = 1200; // Simulated latency for Mac mini processing & file generation

let isRunning = false;
let activeJobId: string | null = null;
let lastHeartbeat = new Date().toISOString();

/**
 * Returns current health and telemetry of the Mac mini automation node.
 */
export function getWorkerStatus(): WorkerStatusInfo {
  return {
    isOnline: isRunning,
    workerName: 'Mac-mini-Automation-Node-01',
    mode: 'SIMULATED_MAC_MINI',
    codexCliEnabled: true,
    activeJobsCount: activeJobId ? 1 : 0,
    lastHeartbeat,
  };
}

/**
 * Process a single quotation job on the Mac mini worker.
 */
async function processQuotation(quotationId: string): Promise<void> {
  activeJobId = quotationId;
  logger.worker.info(`Received Job: ${quotationId}`);

  // 1. Fetch complete quotation details
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!quotation) {
    activeJobId = null;
    throw new Error(`Quotation ${quotationId} not found in database`);
  }

  // 2. Simulated Mac mini hand-off latency
  await sleep(PROCESSING_DELAY_MS);

  // 3. Codex CLI / AI Advisory Generation (Domain specific)
  logger.codex.info(`Analyzing chemical items for ${quotation.customer.companyName}`);
  const advisoryResult = await CodexCliService.generateAdvisory(
    {
      companyName: quotation.customer.companyName,
      contactPerson: quotation.customer.contactPerson,
      email: quotation.customer.email,
      phone: quotation.customer.phone,
      address: quotation.customer.address,
      taxCode: quotation.customer.taxCode,
    },
    quotation.items.map((i) => ({
      productName: i.productName,
      specification: i.specification,
      unit: i.unit,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount,
      amount: i.amount,
    }))
  );

  logger.codex.info(`Advisory generated`, { source: advisoryResult.source });

  // 4. Fill into Master Template working copy
  const filePath = await generateQuotationFile({
    quotationNumber: quotation.quotationNumber,
    createdAt: quotation.createdAt,
    validityDays: quotation.validityDays,
    paymentTerms: quotation.paymentTerms,
    deliveryTerms: quotation.deliveryTerms,
    notes: quotation.notes,
    commercialNote: advisoryResult.commercialNote,
    technicalAdvisory: advisoryResult.technicalAdvisory,
    customer: {
      companyName: quotation.customer.companyName,
      contactPerson: quotation.customer.contactPerson,
      email: quotation.customer.email,
      phone: quotation.customer.phone,
      address: quotation.customer.address,
      taxCode: quotation.customer.taxCode,
    },
    items: quotation.items.map((item) => ({
      productName: item.productName,
      specification: item.specification,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      amount: item.amount,
    })),
  });

  // 5. Update state to COMPLETED
  await prisma.quotation.update({
    where: { id: quotationId },
    data: {
      status: 'COMPLETED',
      filePath,
      completedAt: new Date(),
      errorMessage: null,
    },
  });

  activeJobId = null;
  logger.worker.info(`Successfully finalized: ${quotation.quotationNumber}`, { filePath });
}

/**
 * Atomically claim and process the next pending job.
 *
 * FIX: Uses updateMany with WHERE status='PENDING' instead of findFirst+update
 * to prevent race conditions when multiple worker instances run concurrently.
 * If no rows are affected, another worker already claimed the job.
 */
async function pollAndProcess(): Promise<void> {
  lastHeartbeat = new Date().toISOString();

  // Find the next PENDING quotation
  const pendingJob = await prisma.quotation.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  });

  if (!pendingJob) return;

  // Atomic claim: only proceed if status is still PENDING at update time
  const claimResult = await prisma.quotation.updateMany({
    where: {
      id: pendingJob.id,
      status: 'PENDING', // Prevents race condition — only succeeds if still PENDING
    },
    data: { status: 'PROCESSING' },
  });

  // Another worker already claimed this job
  if (claimResult.count === 0) {
    logger.worker.debug(`Job ${pendingJob.id} already claimed by another worker`);
    return;
  }

  try {
    await processQuotation(pendingJob.id);
  } catch (error) {
    activeJobId = null;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during quotation generation';
    const newRetryCount = pendingJob.retryCount + 1;

    logger.worker.error(`Processing failed for ${pendingJob.quotationNumber}`, {
      error: errorMessage,
      retryCount: newRetryCount,
      maxRetries: MAX_RETRIES,
    });

    if (newRetryCount < MAX_RETRIES) {
      // Re-queue with incremented retry count
      await prisma.quotation.update({
        where: { id: pendingJob.id },
        data: {
          status: 'PENDING',
          retryCount: newRetryCount,
          errorMessage: `[Tự động thử lại ${newRetryCount}/${MAX_RETRIES}]: ${errorMessage}`,
        },
      });
      logger.worker.info(`Queued for retry (${newRetryCount}/${MAX_RETRIES})`);
    } else {
      // Exceeded max retries: Mark FAILED
      await prisma.quotation.update({
        where: { id: pendingJob.id },
        data: {
          status: 'FAILED',
          retryCount: newRetryCount,
          errorMessage: `Đã vượt quá số lần thử lại tối đa (${MAX_RETRIES}): ${errorMessage}`,
        },
      });
      logger.worker.error(`${pendingJob.quotationNumber} marked as FAILED`);
    }
  }
}

/**
 * Start worker loop.
 */
export function startWorker(): void {
  if (isRunning) return;

  isRunning = true;
  logger.worker.info('Connected to queue & waiting for jobs...');

  const loop = async () => {
    while (isRunning) {
      try {
        await pollAndProcess();
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown loop error';
        logger.worker.error('Loop exception', { error: msg });
      }
      await sleep(POLL_INTERVAL_MS);
    }
  };

  loop();
}

/**
 * Stop worker loop.
 */
export function stopWorker(): void {
  isRunning = false;
  logger.worker.info('Disconnected');
}
