const fs = require('fs');
const path = require('path');
const readline = require('readline');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\6c91404a-9ed5-45ab-80a1-18c0120f3eae\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  if (!fs.existsSync(logFile)) {
    console.log('Log file not found:', logFile);
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
      if (obj.type === 'USER_INPUT') {
        console.log(`=== Step ${obj.step_index} ===`);
        console.log(obj.content.substring(0, 1000));
        console.log('=============================\n');
      }
    } catch (e) {}
  }
}

run();
