const fs = require('fs');
const readline = require('readline');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\d4e91801-639d-4f5e-b549-1fa4a7225ab0\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
  console.log('Total lines:', lines.length);
  console.log('Last 5 lines:');
  for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
    try {
      const obj = JSON.parse(lines[i]);
      console.log(`Index ${i} -> Step ${obj.step_index} | Type: ${obj.type} | Status: ${obj.status}`);
    } catch (e) {
      console.log(`Index ${i} -> Error parsing: ${lines[i].substring(0, 100)}`);
    }
  }
}

run();
