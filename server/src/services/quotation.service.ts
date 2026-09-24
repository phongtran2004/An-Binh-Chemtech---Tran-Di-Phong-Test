import { prisma } from '../lib/db';
import { generateQuotationNumber, calculateItemAmount } from '../lib/utils';
import type { CreateQuotationInput } from '../lib/validators';

export class QuotationService {
  public static async listAll() {
    return prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { companyName: true, contactPerson: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  public static async getById(id: string) {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  public static async checkIdempotency(key?: string) {
    if (!key) return null;
    return prisma.quotation.findUnique({
      where: { idempotencyKey: key },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  public static async create(input: CreateQuotationInput) {
    // 1. Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND');
    }

    // 2. Compute sequential number for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayCount = await prisma.quotation.count({
      where: { createdAt: { gte: startOfToday } },
    });

    const quotationNumber = generateQuotationNumber(todayCount + 1);

    // 3. Atomically create Quotation & Items
    return prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: input.customerId,
        paymentTerms: input.paymentTerms,
        deliveryTerms: input.deliveryTerms,
        notes: input.notes,
        validityDays: input.validityDays,
        idempotencyKey: input.idempotencyKey || null,
        status: 'PENDING', // PENDING queues job for Mac mini worker
        items: {
          create: input.items.map((item, index) => ({
            productId: item.productId || null,
            productName: item.productName,
            specification: item.specification,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            amount: calculateItemAmount(item.quantity, item.unitPrice, item.discount),
            sortOrder: index,
          })),
        },
      },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  public static async retry(id: string) {
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) {
      throw new Error('QUOTATION_NOT_FOUND');
    }
    if (quotation.status !== 'FAILED') {
      throw new Error('INVALID_STATUS_FOR_RETRY');
    }

    return prisma.quotation.update({
      where: { id },
      data: {
        status: 'PENDING',
        retryCount: 0,
        errorMessage: null,
      },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }
}
