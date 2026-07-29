const fs = require('fs');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\d4e91801-639d-4f5e-b549-1fa4a7225ab0\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' && obj.step_index >= 300 && obj.step_index <= 333) {
        console.log(`=== Step ${obj.step_index} ===`);
        console.log(obj.content);
        console.log('=============================\n');
      }
    } catch (e) {}
  }
}

run();
