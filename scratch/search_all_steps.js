const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain';

async function searchFile(filePath, folder) {
  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      try {
        const obj = JSON.parse(line);
        if (obj.content && (obj.content.includes('TASK 4: Audit') || obj.content.includes('TASK 5: Help') || obj.content.includes('Batch D') || obj.content.includes('FAQ'))) {
          // If it's not the accidental interruption
          if (obj.content.includes('accidental interruption')) continue;
          console.log(`=== FOUND in folder: ${folder} | Step ${obj.step_index} | Type: ${obj.type} ===`);
          console.log(obj.content);
          console.log('==================================================\n');
        }
      } catch (e) {}
    }
  } catch (err) {}
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
        await searchFile(filePath, folder);
      }
    }
  }
}

run();
