const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain';

function searchFile(filePath, folder, file) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('section d') && (lowerContent.includes('40.') || lowerContent.includes('41.'))) {
      console.log(`Match in folder: ${folder} | file: ${file}`);
      // Find where Step starts in JSONL
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          const text = (obj.content || '').toLowerCase();
          if (text.includes('section d') && (text.includes('40.') || text.includes('41.'))) {
            console.log(`  -> Step ${obj.step_index} | Type: ${obj.type} | Content length: ${text.length}`);
          }
          if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
              const tcStr = JSON.stringify(tc).toLowerCase();
              if (tcStr.includes('section d') && (tcStr.includes('40.') || tcStr.includes('41.'))) {
                console.log(`  -> Step ${obj.step_index} | Tool call: ${tc.name}`);
              }
            }
          }
        } catch (e) {}
      }
    }
  } catch (err) {}
}

function run() {
  const folders = fs.readdirSync(brainDir);
  for (const folder of folders) {
    const logsDir = path.join(brainDir, folder, '.system_generated', 'logs');
    if (!fs.existsSync(logsDir)) continue;

    const files = fs.readdirSync(logsDir);
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      if (fs.statSync(filePath).isFile()) {
        searchFile(filePath, folder, file);
      }
    }
  }
}

run();
