const fs = require('fs');
const path = require('path');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\5ca4a87a-e29d-49b8-8cc8-8f421f548349\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const line = fs.readFileSync(logFile, 'utf8').split('\n')[0];
  try {
    const obj = JSON.parse(line);
    console.log(obj.content);
  } catch (e) {
    console.error(e);
  }
}

run();
