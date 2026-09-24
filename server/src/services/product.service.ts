import { prisma } from '../lib/db';

export class ProductService {
  public static async listAll() {
    return prisma.product.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }
}
