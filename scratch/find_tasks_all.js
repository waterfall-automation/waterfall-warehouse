const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logDir = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\5ca4a87a-e29d-49b8-8cc8-8f421f548349\\.system_generated\\logs';
const files = ['transcript_full.jsonl', 'transcript.jsonl'];

async function run() {
  for (const file of files) {
    const logFile = path.join(logDir, file);
    if (!fs.existsSync(logFile)) continue;
    console.log(`Searching file: ${file}`);
    const fileStream = fs.createReadStream(logFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'USER_INPUT' && obj.content && (obj.content.includes('TASK 4') || obj.content.includes('TASK 5') || obj.content.includes('Task 4') || obj.content.includes('Task 5'))) {
          // If it's not the accidental interruption
          if (obj.content.includes('accidental interruption')) continue;
          console.log(`=== Found in ${file} at Step ${obj.step_index} (${obj.created_at}) ===`);
          console.log(obj.content);
          console.log('=====================================\n');
          return; // Stop after first match
        }
      } catch (e) {}
    }
  }
}

run();
