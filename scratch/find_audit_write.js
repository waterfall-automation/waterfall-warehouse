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
        // Look for tool calls to write_to_file targeting AUDIT_QUESTIONS.md
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            if (tc.name === 'write_to_file' && tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('AUDIT_QUESTIONS.md')) {
              console.log(`=== FOUND WRITE in folder: ${folder} | Step ${obj.step_index} ===`);
              console.log('TargetFile:', tc.args.TargetFile);
              if (tc.args.CodeContent) {
                console.log('CodeContent Length:', tc.args.CodeContent.length);
                const destPath = 'C:\\Users\\kgnan\\OneDrive\\Desktop\\siccasync-complete\\docs\\AUDIT_QUESTIONS.md';
                const dir = path.dirname(destPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(destPath, tc.args.CodeContent, 'utf8');
                console.log('Successfully saved to:', destPath);
                return true;
              }
            }
          }
        }
      } catch (e) {}
    }
  } catch (err) {
    // ignore
  }
  return false;
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
        const found = await searchFile(filePath, folder);
        if (found) return; // Stop after first successful extraction
      }
    }
  }
}

run();
