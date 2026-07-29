const fs = require('fs');
const readline = require('readline');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\history.jsonl';

async function run() {
  if (!fs.existsSync(logFile)) {
    console.log('History file not found:', logFile);
    return;
  }
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      const text = JSON.stringify(obj).toLowerCase();
      if (text.includes('task 5') || text.includes('faq')) {
        console.log('=== MATCH IN HISTORY.JSONL ===');
        console.log(JSON.stringify(obj, null, 2).substring(0, 1500));
        console.log('==============================\n');
      }
    } catch (e) {}
  }
}

run();
