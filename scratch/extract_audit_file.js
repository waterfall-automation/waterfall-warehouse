const fs = require('fs');
const path = require('path');
const readline = require('readline');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\d4e91801-639d-4f5e-b549-1fa4a7225ab0\\.system_generated\\logs\\transcript_full.jsonl';
const targetFile = 'C:\\Users\\kgnan\\OneDrive\\Desktop\\siccasync-complete\\docs\\AUDIT_QUESTIONS.md';

async function run() {
  if (!fs.existsSync(logFile)) {
    console.error('Log file not found:', logFile);
    return;
  }
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 333 && obj.content) {
        console.log('Found Step 333! Extracting document...');
        const content = obj.content;
        
        // Find the start of the markdown document
        const marker = '# ';
        const idx = content.indexOf(marker);
        let mdContent = content;
        if (idx >= 0) {
          mdContent = content.substring(idx);
        }
        
        const dir = path.dirname(targetFile);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(targetFile, mdContent, 'utf8');
        console.log('Saved AUDIT_QUESTIONS.md successfully to:', targetFile);
        return;
      }
    } catch (e) {
      // Ignore JSON parse errors for non-json lines
    }
  }
}

run();
