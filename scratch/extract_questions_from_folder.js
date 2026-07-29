const fs = require('fs');
const readline = require('readline');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\32506d0f-f49c-44a2-bc64-b68a1afc1c12\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.content && obj.content.toLowerCase().includes('section d') && (obj.content.includes('40.') || obj.content.includes('41.'))) {
        console.log(`=== FOUND in 32506d0f | Step ${obj.step_index} | Type: ${obj.type} ===`);
        console.log(obj.content.substring(0, 2000));
        console.log('==================================================\n');
      }
    } catch (e) {}
  }
}

run();
