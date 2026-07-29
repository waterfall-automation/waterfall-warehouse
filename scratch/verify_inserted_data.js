const APPS_URL = 'https://script.google.com/macros/s/AKfycbxePnfzSnkYCEWJMBm5pIQ3hbWK2OmTA7ojXLtVIIHtVnEhGGHgv0tNkflXM6r7LT5Q/exec';

async function fetchTab(tab) {
  const res = await fetch(`${APPS_URL}?sheet=database&tab=${tab}`);
  const json = await res.json();
  return json.data || [];
}

async function run() {
  try {
    console.log('Fetching live Item_Master...');
    const items = await fetchTab('Item_Master');
    const testItems = items.filter(i => i.Item_ID.startsWith('TEST-'));
    const realItems = items.filter(i => !i.Item_ID.startsWith('TEST-'));
    
    console.log(`- Total Items: ${items.length}`);
    console.log(`- Test Items Found: ${testItems.length}`);
    console.log(`- Real Items Count: ${realItems.length}`);
    console.log('Sample Real Items kept intact:', realItems.slice(0, 3).map(i => i.Item_Code));

    console.log('Fetching live Stock_Register...');
    const ledger = await fetchTab('Stock_Register');
    const testLedger = ledger.filter(l => l.Entry_ID.startsWith('TEST-'));
    const realLedger = ledger.filter(l => !l.Entry_ID.startsWith('TEST-'));

    console.log(`- Total Ledger Entries: ${ledger.length}`);
    console.log(`- Test Entries Found: ${testLedger.length}`);
    console.log(`- Real Entries Count: ${realLedger.length}`);

    console.log('Fetching live Users...');
    const users = await fetchTab('Users');
    const testUsers = users.filter(u => u.User_ID.startsWith('TEST-'));
    const realUsers = users.filter(u => !u.User_ID.startsWith('TEST-'));

    console.log(`- Total Users: ${users.length}`);
    console.log(`- Test Users Found: ${testUsers.length}`);
    console.log(`- Real Users Count: ${realUsers.length}`);
  } catch (err) {
    console.error('Verification failed:', err);
  }
}

run();
