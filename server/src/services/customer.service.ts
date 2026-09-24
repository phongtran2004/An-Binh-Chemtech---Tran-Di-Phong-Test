import { prisma } from '../lib/db';

export class CustomerService {
  public static async listAll() {
    return prisma.customer.findMany({
      orderBy: { companyName: 'asc' },
      include: {
        _count: { select: { quotations: true } },
      },
    });
  }

  public static async getById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            items: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
  }
}
