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
          const text = obj.content.toLowerCase();
          if (text.includes('task 5') || text.includes('faq') || text.includes('help')) {
            if (text.includes('sicca') || text.includes('inventory') || text.includes('warehouse') || text.includes('sheet')) {
              console.log(`=== FOUND MATCH in folder: ${folder} | Step ${obj.step_index} ===`);
              console.log(obj.content);
              console.log('==================================================\n');
            }
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
