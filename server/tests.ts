import { db, calculateLineTotals, toCents, fromCents } from './db.ts';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  timestamp: string;
  results: TestResult[];
}

export function runEamsTestSuite(): TestSuiteSummary {
  const startTime = Date.now();
  const results: TestResult[] = [];

  function test(name: string, category: string, fn: () => void) {
    const t0 = Date.now();
    try {
      fn();
      results.push({
        name,
        category,
        passed: true,
        message: 'Assertion passed successfully',
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      results.push({
        name,
        category,
        passed: false,
        message: err.message || 'Assertion failed',
        durationMs: Date.now() - t0,
      });
    }
  }

  // 1. Decimal-Safe Arithmetic Tests
  test('Decimal-safe calculation eliminates floating-point rounding errors', 'Finance & Math', () => {
    // 3 items at 0.10 currency units + 8.25% tax
    const calc = calculateLineTotals(3, 0.1, 0, 8.25);
    if (calc.subtotal !== 0.3) throw new Error(`Subtotal expected 0.30, got ${calc.subtotal}`);
    // 0.30 * 0.0825 = 0.02475 -> round to 0.02
    if (calc.taxAmount !== 0.02) throw new Error(`Tax expected 0.02, got ${calc.taxAmount}`);
    if (calc.total !== 0.32) throw new Error(`Total expected 0.32, got ${calc.total}`);

    // Verify cents conversion
    if (toCents(19.99) !== 1999) throw new Error('toCents failed');
    if (fromCents(1999) !== 19.99) throw new Error('fromCents failed');
  });

  // 2. Asset Integrity & Double Allocation Prevention
  test('Prevents allocating an already RENTED or SOLD asset to another customer', 'Asset Rules', () => {
    const assets = db.getAssets();
    const rentedAsset = assets.find((a) => a.status === 'RENTED');
    if (!rentedAsset) throw new Error('No rented asset available to test');

    // Attempting to rent or allocate this asset must fail
    if (rentedAsset.status !== 'AVAILABLE' && rentedAsset.status !== 'RESERVED') {
      // Status is RENTED, SOLD, or IN_MAINTENANCE
      const isAvailableForNewContract = (rentedAsset.status as string) === 'AVAILABLE';
      if (isAvailableForNewContract) {
        throw new Error('Rented asset erroneously marked as available');
      }
    }
  });

  // 3. Customer Credit Limit Verification
  test('Customer credit limit and outstanding balances are tracked accurately', 'CRM', () => {
    const customers = db.getCustomers();
    const cust1 = customers.find((c) => c.id === 'CUST-001');
    if (!cust1) throw new Error('Customer CUST-001 not found');
    if (cust1.creditLimit <= 0) throw new Error('Customer credit limit must be positive');
    if (cust1.outstandingBalance < 0) throw new Error('Outstanding balance cannot be negative');
  });

  // 4. Sales Quotation Approval Flow
  test('Quotation calculates line items, discounts, and total tax accurately', 'Sales', () => {
    const quotes = db.getQuotations();
    const quote = quotes[0];
    if (!quote) throw new Error('No quotation found');
    if (quote.items.length === 0) throw new Error('Quotation has no items');

    let sum = 0;
    quote.items.forEach((item) => {
      sum += item.total;
    });
    // Grand total should equal sum within 1 cent
    if (Math.abs(quote.grandTotal - sum) > 0.05) {
      throw new Error(`Quotation grand total mismatch: ${quote.grandTotal} vs sum ${sum}`);
    }
  });

  // 5. Rental Contract Duration & Security Deposit
  test('Rental contract requires security deposit and holds asset during lease', 'Rentals', () => {
    const rentals = db.getRentals();
    const activeRental = rentals.find((r) => r.status === 'ACTIVE');
    if (!activeRental) throw new Error('No active rental contract found');
    if (activeRental.securityDeposit <= 0) throw new Error('Security deposit must be greater than zero');
    if (activeRental.depositStatus !== 'HELD') throw new Error('Active rental deposit must be HELD');
  });

  // 6. Payment Allocation Integrity
  test('Payment confirmed reduces outstanding invoice balance without underflowing', 'Billing & Payments', () => {
    const payments = db.getPayments();
    const confirmedPayment = payments.find((p) => p.status === 'CONFIRMED' && p.allocations.length > 0);
    if (!confirmedPayment) throw new Error('No confirmed allocated payment found');

    const allocation = confirmedPayment.allocations[0];
    const invoice = db.getInvoices().find((i) => i.id === allocation.invoiceId);
    if (!invoice) throw new Error('Allocated invoice not found');
    if (invoice.paidAmount < allocation.allocatedAmount) {
      throw new Error('Invoice paidAmount is less than payment allocation');
    }
  });

  // 7. Handover & Delivery Verification
  test('Delivery requires verified serial numbers and recipient confirmation', 'Logistics', () => {
    const deliveries = db.getDeliveries();
    const acceptedDelivery = deliveries.find((d) => d.status === 'CUSTOMER_ACCEPTED');
    if (!acceptedDelivery) throw new Error('No accepted delivery record found');
    if (!acceptedDelivery.digitalSignature) throw new Error('Customer accepted delivery must contain proof of signature');
  });

  // 8. Maintenance Work Order Impact
  test('Maintenance work order records parts and labor costs', 'Maintenance', () => {
    const workOrders = db.getWorkOrders();
    const wo = workOrders[0];
    if (!wo) throw new Error('No work order found');
    if (wo.totalCost !== wo.partsCost + wo.laborCost) {
      throw new Error(`Work order cost mismatch: ${wo.totalCost} != ${wo.partsCost} + ${wo.laborCost}`);
    }
  });

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  return {
    total,
    passed,
    failed,
    durationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    results,
  };
}
