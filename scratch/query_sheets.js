const APPS_URL = 'https://script.google.com/macros/s/AKfycbxePnfzSnkYCEWJMBm5pIQ3hbWK2OmTA7ojXLtVIIHtVnEhGGHgv0tNkflXM6r7LT5Q/exec';

async function run() {
  try {
    const url = `${APPS_URL}?sheet=database&action=listTabs`;
    console.log('Fetching:', url);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const json = await res.json();
    console.log('Result:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
