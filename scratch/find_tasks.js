const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\5ca4a87a-e29d-49b8-8cc8-8f421f548349\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' && obj.content && (obj.content.includes('TASK 4') || obj.content.includes('TASK 5') || obj.content.includes('Task 4') || obj.content.includes('Task 5'))) {
        console.log(`=== Step ${obj.step_index} (${obj.created_at}) ===`);
        console.log(obj.content);
        console.log('=====================================\n');
      }
    } catch (e) {}
  }
}

run();
