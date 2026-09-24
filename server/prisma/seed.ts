import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();

  // --- Customers (mock data - Vietnamese chemical industry) ---
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: uuidv4(),
        companyName: 'Công ty TNHH Hóa Chất Phương Nam',
        contactPerson: 'Nguyễn Văn An',
        email: 'an.nguyen@phuongnam-chem.vn',
        phone: '028-3823-4567',
        address: '123 Nguyễn Thị Minh Khai, Q.1, TP.HCM',
        taxCode: '0301234567',
      },
    }),
    prisma.customer.create({
      data: {
        id: uuidv4(),
        companyName: 'Công ty CP Sản Xuất Đại Việt',
        contactPerson: 'Trần Thị Bình',
        email: 'binh.tran@daiviet-mfg.vn',
        phone: '028-3845-6789',
        address: '456 Trần Hưng Đạo, Q.5, TP.HCM',
        taxCode: '0309876543',
      },
    }),
    prisma.customer.create({
      data: {
        id: uuidv4(),
        companyName: 'Công ty TNHH Nhựa Tân Phát',
        contactPerson: 'Lê Minh Cường',
        email: 'cuong.le@tanphat-plastics.vn',
        phone: '0274-382-1234',
        address: '789 KCN Mỹ Phước, Bến Cát, Bình Dương',
        taxCode: '3702345678',
      },
    }),
    prisma.customer.create({
      data: {
        id: uuidv4(),
        companyName: 'Công ty CP Dược Phẩm Sài Gòn',
        contactPerson: 'Phạm Thị Dung',
        email: 'dung.pham@sgpharma.vn',
        phone: '028-3956-7890',
        address: '321 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM',
        taxCode: '0305678901',
      },
    }),
    prisma.customer.create({
      data: {
        id: uuidv4(),
        companyName: 'Công ty TNHH Sơn Á Đông',
        contactPerson: 'Hoàng Văn Em',
        email: 'em.hoang@adongpaint.vn',
        phone: '0251-383-4567',
        address: '567 KCN Nhơn Trạch, Đồng Nai',
        taxCode: '3601234567',
      },
    }),
  ]);

  // --- Products (mock chemical products) ---
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Sodium Hydroxide (NaOH)',
        specification: 'Dạng vảy, 99%, 25kg/bao',
        unit: 'Bao',
        defaultPrice: 450000,
        category: 'Hóa chất cơ bản',
      },
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Hydrochloric Acid (HCl)',
        specification: '32-35%, 30L/can',
        unit: 'Can',
        defaultPrice: 180000,
        category: 'Hóa chất cơ bản',
      },
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Sulfuric Acid (H₂SO₄)',
        specification: '98%, 250kg/phuy',
        unit: 'Phuy',
        defaultPrice: 2800000,
        category: 'Hóa chất cơ bản',
      },
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Ethanol (C₂H₅OH)',
        specification: '96%, 200L/phuy',
        unit: 'Phuy',
        defaultPrice: 3200000,
        category: 'Dung môi',
      },
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Acetone (CH₃COCH₃)',
        specification: '99.5%, 160kg/phuy',
        unit: 'Phuy',
        defaultPrice: 4500000,
        category: 'Dung môi',
      },
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Titanium Dioxide (TiO₂)',
        specification: 'R-902+, 25kg/bao',
        unit: 'Bao',
        defaultPrice: 1650000,
        category: 'Phụ gia',
      },
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Calcium Carbonate (CaCO₃)',
        specification: 'Bột mịn, 40kg/bao',
        unit: 'Bao',
        defaultPrice: 95000,
        category: 'Phụ gia',
      },
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Polyethylene Glycol (PEG 400)',
        specification: 'USP grade, 200kg/phuy',
        unit: 'Phuy',
        defaultPrice: 5800000,
        category: 'Nguyên liệu dược',
      },
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Isopropyl Alcohol (IPA)',
        specification: '99.7%, 160kg/phuy',
        unit: 'Phuy',
        defaultPrice: 3900000,
        category: 'Dung môi',
      },
    }),
    prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'Citric Acid Monohydrate',
        specification: 'Food grade, 25kg/bao',
        unit: 'Bao',
        defaultPrice: 520000,
        category: 'Phụ gia thực phẩm',
      },
    }),
  ]);

  console.log(`✅ Seeded ${customers.length} customers`);
  console.log(`✅ Seeded ${products.length} products`);
  console.log('🌱 Seeding completed!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
