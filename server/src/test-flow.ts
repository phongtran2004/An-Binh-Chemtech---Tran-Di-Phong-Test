import { CustomerService } from './services/customer.service';
import { ProductService } from './services/product.service';
import { QuotationService } from './services/quotation.service';
import { startWorker, stopWorker, getWorkerStatus } from './lib/worker';
import { sleep } from './lib/utils';
import fs from 'fs';

async function runEndToEndVerification() {
  console.log('🧪 Starting End-to-End Quotation Verification Test...');

  // 1. Fetch Customers & Products
  const customers = await CustomerService.listAll();
  const products = await ProductService.listAll();

  console.log(`✓ Fetched ${customers.length} customers and ${products.length} products.`);
  if (customers.length === 0 || products.length === 0) {
    throw new Error('Database is empty. Please run seed first.');
  }

  const testCustomer = customers[0];
  console.log(`✓ Using test customer: ${testCustomer.companyName} (${testCustomer.contactPerson})`);

  // 2. Start the Mac mini worker
  startWorker();
  const status = getWorkerStatus();
  console.log(`✓ Worker online: ${status.workerName} (Mode: ${status.mode})`);

  // 3. Create Quotation with corrosive & solvent chemicals
  const newQuotation = await QuotationService.create({
    customerId: testCustomer.id,
    paymentTerms: 'Thanh toán 30 ngày kể từ ngày giao hàng',
    deliveryTerms: 'Giao tại kho bên mua bằng xe chuyên dụng',
    notes: 'Kèm COA & MSDS tiêu chuẩn nhà sản xuất',
    validityDays: 30,
    items: [
      {
        productId: products[0].id,
        productName: products[0].name,
        specification: products[0].specification,
        unit: products[0].unit,
        quantity: 100,
        unitPrice: products[0].defaultPrice,
        discount: 5,
        sortOrder: 0,
      },
      {
        productId: products[1].id,
        productName: products[1].name,
        specification: products[1].specification,
        unit: products[1].unit,
        quantity: 50,
        unitPrice: products[1].defaultPrice,
        discount: 0,
        sortOrder: 1,
      },
    ],
    idempotencyKey: `test-e2e-${Date.now()}`,
  });

  console.log(`✓ Quotation created with ID: ${newQuotation.id} | Number: ${newQuotation.quotationNumber}`);
  console.log(`✓ Initial Status: ${newQuotation.status}`);

  // 4. Poll until COMPLETED
  let isDone = false;
  let attempts = 0;
  while (!isDone && attempts < 15) {
    await sleep(1000);
    attempts++;
    const q = await QuotationService.getById(newQuotation.id);
    if (!q) break;

    console.log(`  ... [Poll ${attempts}s] Current Status: ${q.status}`);
    if (q.status === 'COMPLETED') {
      isDone = true;
      console.log(`🎉 Quotation COMPLETED in ${attempts}s!`);
      console.log(`📁 Generated File: ${q.filePath}`);

      if (q.filePath && fs.existsSync(q.filePath)) {
        const stats = fs.statSync(q.filePath);
        console.log(`✓ File verified on disk! Size: ${stats.size} bytes`);
      } else {
        throw new Error(`File was not found on disk at: ${q.filePath}`);
      }
      break;
    } else if (q.status === 'FAILED') {
      throw new Error(`Quotation failed: ${q.errorMessage}`);
    }
  }

  stopWorker();

  if (!isDone) {
    throw new Error('Test timed out before completion.');
  }

  console.log('\n🏆 ALL END-TO-END TESTS PASSED SUCCESSFULLY!');
}

runEndToEndVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
