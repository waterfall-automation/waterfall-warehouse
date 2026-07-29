const fs = require('fs');
const readline = require('readline');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\history.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.display && obj.display.includes('TASK 5 — Help/FAQ page')) {
        console.log('=== FULL DESCRIPTION OF TASK 5 ===');
        console.log(obj.display);
        console.log('==================================');
        return;
      }
    } catch (e) {}
  }
}

run();
