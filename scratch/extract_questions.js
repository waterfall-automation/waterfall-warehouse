const fs = require('fs');
const readline = require('readline');

async function run() {
  const fileStream = fs.createReadStream('C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\d4e91801-639d-4f5e-b549-1fa4a7225ab0\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT') {
      console.log('--- USER INPUT (Step ' + obj.step_index + ') ---');
      console.log(obj.content);
    }
  }
}
run();
