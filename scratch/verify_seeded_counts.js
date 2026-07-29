const APPS_URL = 'https://script.google.com/macros/s/AKfycbxePnfzSnkYCEWJMBm5pIQ3hbWK2OmTA7ojXLtVIIHtVnEhGGHgv0tNkflXM6r7LT5Q/exec';

async function fetchTab(tabName) {
  const url = `${APPS_URL}?sheet=database&tab=${tabName}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json || json.success === false) {
    throw new Error(json?.error || `Failed to fetch tab ${tabName}`);
  }
  return json.data;
}

async function run() {
  const tabs = [
    'Vendors', 'Users', 'Cupboards', 'Boxes', 'Item_Master',
    'Placements', 'Invoices', 'Stock_Register', 'Notice_Board', 'Tasks'
  ];
  
  console.log('Fetching live counts...');
  for (const tab of tabs) {
    try {
      const data = await fetchTab(tab);
      console.log(`- ${tab}: ${data.length} row(s)`);
      if (tab === 'Users') {
        console.log('  Users:', data.map(u => `${u.Full_Name} (${u.Email})`));
      }
    } catch (err) {
      console.error(`- Error fetching ${tab}: ${err.message}`);
    }
  }
}

run();
