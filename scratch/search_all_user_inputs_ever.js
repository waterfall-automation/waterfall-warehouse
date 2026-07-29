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
        if (obj.type === 'USER_INPUT' && obj.content) {
          const text = obj.content;
          if (text.includes('40.') || text.includes('Section D:') || text.includes('Section D') || text.includes('41.')) {
            console.log(`=== MATCH in folder: ${folder} | Step ${obj.step_index} ===`);
            console.log(text.substring(0, 1500));
            console.log('==================================================\n');
          }
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
