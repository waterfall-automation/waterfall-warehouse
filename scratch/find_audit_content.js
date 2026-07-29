const fs = require('fs');
const path = require('path');
const readline = require('readline');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\d4e91801-639d-4f5e-b549-1fa4a7225ab0\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  if (!fs.existsSync(logFile)) {
    console.error('Log file not found:', logFile);
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
        const text = obj.content;
        if (text.includes('1.') || text.includes('40.') || text.includes('AUDIT_QUESTIONS')) {
          console.log(`=== Step ${obj.step_index} | Length: ${text.length} ===`);
          console.log(text.substring(0, 500));
          console.log('==================================================\n');
        }
      }
    } catch (e) {}
  }
}

run();
