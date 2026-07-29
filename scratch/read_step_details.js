const fs = require('fs');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\d4e91801-639d-4f5e-b549-1fa4a7225ab0\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.step_index >= 334 && obj.step_index <= 338) {
        console.log(`=== Step ${obj.step_index} | Type: ${obj.type} ===`);
        console.log('Tool calls:', JSON.stringify(obj.tool_calls, null, 2));
        if (obj.content) console.log('Content:', obj.content.substring(0, 500));
        console.log('==================================================\n');
      }
    } catch (e) {}
  }
}

run();
