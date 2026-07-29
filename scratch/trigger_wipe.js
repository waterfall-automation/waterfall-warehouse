const APPS_URL = 'https://script.google.com/macros/s/AKfycbxePnfzSnkYCEWJMBm5pIQ3hbWK2OmTA7ojXLtVIIHtVnEhGGHgv0tNkflXM6r7LT5Q/exec';

async function run() {
  try {
    const url = `${APPS_URL}?action=forceWipeDemoReset&confirm=FORCE-WIPE-DEMO-RESET`;
    console.log('Sending force wipe request to:', url);
    const res = await fetch(url);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
