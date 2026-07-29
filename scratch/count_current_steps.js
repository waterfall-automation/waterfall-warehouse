const fs = require('fs');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\5ca4a87a-e29d-49b8-8cc8-8f421f548349\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
  console.log('Current conversation total lines:', lines.length);
  console.log('First 5 lines:');
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    try {
      const obj = JSON.parse(lines[i]);
      console.log(`Index ${i} -> Step ${obj.step_index} | Type: ${obj.type} | Status: ${obj.status}`);
      if (obj.content) console.log('Content preview:', obj.content.substring(0, 150));
    } catch (e) {
      console.log(`Index ${i} -> Error parsing: ${lines[i].substring(0, 100)}`);
    }
  }
}

run();
