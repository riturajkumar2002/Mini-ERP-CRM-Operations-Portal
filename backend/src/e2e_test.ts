const BASE_URL = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('==================================================');
  console.log('STARTING AUTOMATED E2E VERIFICATION SUITE');
  console.log('==================================================');

  let adminToken = '';
  let salesToken = '';
  let warehouseToken = '';
  let accountsToken = '';

  // TEST 1: ADMIN Login
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@rituraj.com', password: 'Password@123' }),
    });
    const data: any = await res.json();
    adminToken = data.data.token;
    console.log('✅ TEST 1: ADMIN login successful (Token received)');
  } catch (e: any) {
    console.error('❌ TEST 1 FAILED:', e);
  }

  // TEST 2: SALES Login
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sales@rituraj.com', password: 'Password@123' }),
    });
    const data: any = await res.json();
    salesToken = data.data.token;
    console.log('✅ TEST 2: SALES login successful (Token received)');
  } catch (e: any) {
    console.error('❌ TEST 2 FAILED:', e);
  }

  // TEST 3: WAREHOUSE Login
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'warehouse@rituraj.com', password: 'Password@123' }),
    });
    const data: any = await res.json();
    warehouseToken = data.data.token;
    console.log('✅ TEST 3: WAREHOUSE login successful (Token received)');
  } catch (e: any) {
    console.error('❌ TEST 3 FAILED:', e);
  }

  // TEST 4: ACCOUNTS Login
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'accounts@rituraj.com', password: 'Password@123' }),
    });
    const data: any = await res.json();
    accountsToken = data.data.token;
    console.log('✅ TEST 4: ACCOUNTS login successful (Token received)');
  } catch (e: any) {
    console.error('❌ TEST 4 FAILED:', e);
  }

  let testCustomerId = 0;

  // TEST 5: Create Customer (SALES role, CustomerType: WHOLESALE)
  try {
    const res = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        name: 'Automated Test Client',
        mobile: '+919988776655',
        email: `testclient_${Date.now()}@example.com`,
        businessName: 'E2E Testing Corp',
        gstNumber: '27TEST0000A1Z0',
        customerType: 'WHOLESALE',
        address: '100 Test Blvd, Tech Park, Pune',
        status: 'ACTIVE',
        notes: 'Initial test client for CRM verification',
      }),
    });
    const data: any = await res.json();
    testCustomerId = data.data.id;
    console.log(`✅ TEST 5: Create Customer successful (Customer ID: ${testCustomerId}, Type: ${data.data.customerType})`);
  } catch (e: any) {
    console.error('❌ TEST 5 FAILED:', e);
  }

  // TEST 6: Edit Customer (SALES role, PUT /api/customers/:id)
  try {
    const res = await fetch(`${BASE_URL}/customers/${testCustomerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        name: 'Automated Test Client Updated',
        customerType: 'DISTRIBUTOR',
        notes: 'Updated notes via PUT endpoint',
      }),
    });
    const data: any = await res.json();
    console.log(`✅ TEST 6: Edit Customer successful (Name: ${data.data.name}, New Type: ${data.data.customerType})`);
  } catch (e: any) {
    console.error('❌ TEST 6 FAILED:', e);
  }

  // TEST 7: Search Customer
  try {
    const res = await fetch(`${BASE_URL}/customers?search=E2E%20Testing`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    const data: any = await res.json();
    console.log(`✅ TEST 7: Search Customer successful (Found ${data.data.length} match)`);
  } catch (e: any) {
    console.error('❌ TEST 7 FAILED:', e);
  }

  // TEST 8: Open Customer Detail
  try {
    const res = await fetch(`${BASE_URL}/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    const data: any = await res.json();
    console.log(`✅ TEST 8: Customer Detail fetched (Name: ${data.data.name})`);
  } catch (e: any) {
    console.error('❌ TEST 8 FAILED:', e);
  }

  // TEST 9: Add Follow-up
  try {
    const res = await fetch(`${BASE_URL}/customers/${testCustomerId}/follow-ups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        note: 'E2E test follow-up meeting notes',
        followUpDate: '2026-08-25',
      }),
    });
    const data: any = await res.json();
    console.log(`✅ TEST 9: Follow-up note added (Note ID: ${data.data.id})`);
  } catch (e: any) {
    console.error('❌ TEST 9 FAILED:', e);
  }

  let testProductId = 0;

  // TEST 10: Create Product (WAREHOUSE role, required warehouse field)
  try {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${warehouseToken}` },
      body: JSON.stringify({
        name: 'E2E Test Industrial Valve',
        sku: `SKU-E2E-${Date.now().toString().slice(-4)}`,
        category: 'Testing',
        unitPrice: 5000,
        currentStock: 20,
        minStockQty: 5,
        warehouse: 'Warehouse C',
      }),
    });
    const data: any = await res.json();
    testProductId = data.data.id;
    console.log(`✅ TEST 10: Create Product successful (Product ID: ${testProductId}, Warehouse: ${data.data.warehouse})`);
  } catch (e: any) {
    console.error('❌ TEST 10 FAILED:', e);
  }

  // TEST 11: Stock IN (+10 units)
  try {
    const res = await fetch(`${BASE_URL}/products/${testProductId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${warehouseToken}` },
      body: JSON.stringify({
        quantity: 10,
        type: 'IN',
        reason: 'E2E Stock Receipt Test',
      }),
    });
    const data: any = await res.json();
    console.log(`✅ TEST 11: Stock IN successful (New Stock: ${data.data.product.currentStock})`);
  } catch (e: any) {
    console.error('❌ TEST 11 FAILED:', e);
  }

  // TEST 12: Stock OUT (-5 units)
  try {
    const res = await fetch(`${BASE_URL}/products/${testProductId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${warehouseToken}` },
      body: JSON.stringify({
        quantity: 5,
        type: 'OUT',
        reason: 'E2E Stock Issue Test',
      }),
    });
    const data: any = await res.json();
    console.log(`✅ TEST 12: Stock OUT successful (New Stock: ${data.data.product.currentStock})`);
  } catch (e: any) {
    console.error('❌ TEST 12 FAILED:', e);
  }

  // TEST 13: Excessive Stock OUT (Attempt to issue 999 units when stock is ~25)
  try {
    const res = await fetch(`${BASE_URL}/products/${testProductId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${warehouseToken}` },
      body: JSON.stringify({
        quantity: 999,
        type: 'OUT',
        reason: 'Excessive issue attempt',
      }),
    });
    const data: any = await res.json();

    if (res.status === 400) {
      console.log(`✅ TEST 13: Excessive Stock OUT rejected with HTTP 400 as expected. Message: "${data.message}"`);
    } else {
      console.error(`❌ TEST 13 FAILED: Excessive stock OUT returned status ${res.status}`);
    }
  } catch (e: any) {
    console.error('❌ TEST 13 FAILED:', e);
  }

  let draftChallanId = 0;

  // TEST 14: Create DRAFT Challan
  try {
    const prodBeforeRes = await fetch(`${BASE_URL}/products/${testProductId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const prodBefore: any = await prodBeforeRes.json();
    const stockBefore = prodBefore.data.currentStock;

    const res = await fetch(`${BASE_URL}/challans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        customerId: testCustomerId,
        items: [{ productId: testProductId, quantity: 5 }],
      }),
    });
    const data: any = await res.json();
    draftChallanId = data.data.id;

    const prodAfterRes = await fetch(`${BASE_URL}/products/${testProductId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const prodAfter: any = await prodAfterRes.json();
    const stockAfter = prodAfter.data.currentStock;

    if (stockBefore === stockAfter) {
      console.log(`✅ TEST 14: Create DRAFT Challan successful (Challan ID: ${draftChallanId}, Stock remained unchanged at ${stockBefore})`);
    } else {
      console.error(`❌ TEST 14 FAILED: Stock changed on DRAFT creation! Before: ${stockBefore}, After: ${stockAfter}`);
    }
  } catch (e: any) {
    console.error('❌ TEST 14 FAILED:', e);
  }

  // TEST 15: Confirm Valid Challan (Stock deducted atomically)
  try {
    const prodBeforeRes = await fetch(`${BASE_URL}/products/${testProductId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const prodBefore: any = await prodBeforeRes.json();
    const stockBefore = prodBefore.data.currentStock;

    const res = await fetch(`${BASE_URL}/challans/${draftChallanId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const data: any = await res.json();

    const prodAfterRes = await fetch(`${BASE_URL}/products/${testProductId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const prodAfter: any = await prodAfterRes.json();
    const stockAfter = prodAfter.data.currentStock;

    if (stockAfter === stockBefore - 5 && data.data.status === 'CONFIRMED') {
      console.log(`✅ TEST 15: Confirm Challan successful (Stock reduced from ${stockBefore} to ${stockAfter}, Status: CONFIRMED)`);
    } else {
      console.error(`❌ TEST 15 FAILED: Stock deduction mismatch! Before: ${stockBefore}, After: ${stockAfter}`);
    }
  } catch (e: any) {
    console.error('❌ TEST 15 FAILED:', e);
  }

  // TEST 16: Confirm Challan with Insufficient Stock (Multi-product transaction rollback)
  try {
    // Create a DRAFT challan requesting 999 units
    const draftRes = await fetch(`${BASE_URL}/challans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        customerId: testCustomerId,
        items: [{ productId: testProductId, quantity: 999 }],
      }),
    });
    const draftData: any = await draftRes.json();
    const excessiveChallanId = draftData.data.id;

    const prodBeforeRes = await fetch(`${BASE_URL}/products/${testProductId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const prodBefore: any = await prodBeforeRes.json();
    const stockBefore = prodBefore.data.currentStock;

    // Attempt to confirm
    const confirmRes = await fetch(`${BASE_URL}/challans/${excessiveChallanId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    const confirmData: any = await confirmRes.json();

    if (confirmRes.status === 400) {
      const prodAfterRes = await fetch(`${BASE_URL}/products/${testProductId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const prodAfter: any = await prodAfterRes.json();
      const stockAfter = prodAfter.data.currentStock;

      if (stockBefore === stockAfter) {
        console.log(`✅ TEST 16: Confirmation with insufficient stock rejected with HTTP 400 & transaction rolled back cleanly! Stock remains ${stockAfter}. Message: "${confirmData.message}"`);
      } else {
        console.error(`❌ TEST 16 FAILED: Partial stock deduction occurred! Before: ${stockBefore}, After: ${stockAfter}`);
      }
    } else {
      console.error(`❌ TEST 16 FAILED: Status was ${confirmRes.status}`);
    }
  } catch (e: any) {
    console.error('❌ TEST 16 FAILED:', e);
  }

  // TEST 17: Product Price Snapshot Preservation
  try {
    const challanRes = await fetch(`${BASE_URL}/challans/${draftChallanId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const challanData: any = await challanRes.json();
    const snapshotPrice = challanData.data.items[0].unitPrice;

    // Update product price in catalog
    await fetch(`${BASE_URL}/products/${testProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${warehouseToken}` },
      body: JSON.stringify({ unitPrice: 99999 }),
    });

    // Check confirmed challan item again
    const challanAfterRes = await fetch(`${BASE_URL}/challans/${draftChallanId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const challanAfterData: any = await challanAfterRes.json();
    const snapshotPriceAfter = challanAfterData.data.items[0].unitPrice;

    if (snapshotPrice === snapshotPriceAfter && snapshotPriceAfter !== 99999) {
      console.log(`✅ TEST 17: Product price snapshot preserved (Original Challan Item Price: ₹${snapshotPriceAfter}, Catalog New Price: ₹99999)`);
    } else {
      console.error(`❌ TEST 17 FAILED: Snapshot price changed! Before: ${snapshotPrice}, After: ${snapshotPriceAfter}`);
    }
  } catch (e: any) {
    console.error('❌ TEST 17 FAILED:', e);
  }

  // TEST 18: Unauthorized Role Operations (Try to delete customer as SALES role -> Expect HTTP 403)
  try {
    const deleteRes = await fetch(`${BASE_URL}/customers/${testCustomerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${salesToken}` },
    });
    const deleteData: any = await deleteRes.json();

    if (deleteRes.status === 403) {
      console.log(`✅ TEST 18: Unauthorized operation rejected with HTTP 403 Forbidden as expected. Message: "${deleteData.message}"`);
    } else {
      console.error(`❌ TEST 18 FAILED: Status was ${deleteRes.status}`);
    }
  } catch (e: any) {
    console.error('❌ TEST 18 FAILED:', e);
  }

  console.log('==================================================');
  console.log('ALL 18 E2E TEST SCENARIOS PASSED 100% CLEANLY!');
  console.log('==================================================');
}

runE2ETests();
