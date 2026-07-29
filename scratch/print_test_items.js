const APPS_URL = 'https://script.google.com/macros/s/AKfycbxePnfzSnkYCEWJMBm5pIQ3hbWK2OmTA7ojXLtVIIHtVnEhGGHgv0tNkflXM6r7LT5Q/exec';

async function fetchTab(tab) {
  const res = await fetch(`${APPS_URL}?sheet=database&tab=${tab}`);
  const json = await res.json();
  return json.data || [];
}

async function run() {
  try {
    const items = await fetchTab('Item_Master');
    const testItems = items.filter(i => i.Item_ID.startsWith('TEST-'));
    console.log('--- TEST ITEMS ---');
    testItems.forEach(i => console.log(`ID: ${i.Item_ID}, Code: ${i.Item_Code}, Name: ${i.Item_Name}, Location: ${i.Location}`));

    const ledger = await fetchTab('Stock_Register');
    const testLedger = ledger.filter(l => l.Entry_ID.startsWith('TEST-'));
    console.log('\n--- TEST LEDGER ENTRIES ---');
    testLedger.forEach(l => console.log(`ID: ${l.Entry_ID}, Item Code: ${l.Item_Code}, Type: ${l.Transaction_Type}, Qty: ${l.Inward_Qty || l.Outward_Qty}, Location: ${l.Location}, Vendor: ${l.Vendor_Name || 'N/A'}`));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
