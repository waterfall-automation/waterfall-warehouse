const fs = require('fs');
const path = require('path');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\32506d0f-f49c-44a2-bc64-b68a1afc1c12\\.system_generated\\logs\\transcript_full.jsonl';

function run() {
  if (!fs.existsSync(logFile)) {
    console.error('File not found:', logFile);
    return;
  }
  const content = fs.readFileSync(logFile, 'utf8');
  const lower = content.toLowerCase();
  
  const searchTerms = ['section d', '40.', 'item master'];
  for (const term of searchTerms) {
    let idx = lower.indexOf(term);
    if (idx >= 0) {
      console.log(`=== FOUND TERM "${term}" at index ${idx} ===`);
      console.log(content.substring(Math.max(0, idx - 500), Math.min(content.length, idx + 1500)));
      console.log('============================================\n');
      return;
    }
  }
  console.log('No terms found in content.');
}

run();
