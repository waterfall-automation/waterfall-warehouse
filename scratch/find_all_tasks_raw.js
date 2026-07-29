const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain';

async function searchFile(filePath, folder) {
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
        if (text.includes('Task 4') || text.includes('Task 5') || text.includes('TASK 4') || text.includes('TASK 5')) {
          console.log(`=== Folder: ${folder} | Step ${obj.step_index} ===`);
          console.log(obj.content.substring(0, 1000));
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

    const files = ['transcript.jsonl'];
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      if (fs.existsSync(filePath)) {
        await searchFile(filePath, folder);
      }
    }
  }
}

run();
