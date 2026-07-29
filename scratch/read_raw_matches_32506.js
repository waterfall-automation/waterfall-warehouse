const fs = require('fs');
const path = require('path');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\32506d0f-f49c-44a2-bc64-b68a1afc1c12\\.system_generated\\logs\\transcript_full.jsonl';

function run() {
  if (!fs.existsSync(logFile)) {
    console.error('File not found:', logFile);
    return;
  }
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  console.log(`Searching ${lines.length} lines in 32506d0f transcript...`);
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('section d') && (lower.includes('40.') || lower.includes('41.'))) {
      console.log(`=== Line ${i} ===`);
      console.log(lines[i].substring(0, 1500));
      console.log('=================\n');
    }
  }
}

run();
