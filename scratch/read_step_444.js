const fs = require('fs');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\5ca4a87a-e29d-49b8-8cc8-8f421f548349\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 444) {
        console.log('=== STEP 444 GENERIC CONTENT ===');
        console.log(obj.content);
        console.log('================================');
        return;
      }
    } catch (e) {}
  }
}

run();
