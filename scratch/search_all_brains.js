const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain';

async function searchFile(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' && obj.content) {
        if (obj.content.includes('TASK 4') || obj.content.includes('TASK 5') || obj.content.includes('Task 4') || obj.content.includes('Task 5')) {
          if (obj.content.includes('accidental interruption')) continue;
          console.log(`=== FOUND in ${filePath} at Step ${obj.step_index} ===`);
          console.log(obj.content);
          console.log('==================================================\n');
        }
      }
    } catch (e) {}
  }
}

async function run() {
  const folders = fs.readdirSync(brainDir);
  for (const folder of folders) {
    const logsDir = path.join(brainDir, folder, '.system_generated', 'logs');
    if (!fs.existsSync(logsDir)) continue;

    const files = ['transcript_full.jsonl', 'transcript.jsonl'];
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      if (fs.existsSync(filePath)) {
        await searchFile(filePath);
      }
    }
  }
}

run();
