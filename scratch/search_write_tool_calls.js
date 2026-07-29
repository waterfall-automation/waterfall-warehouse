const fs = require('fs');
const readline = require('readline');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\d4e91801-639d-4f5e-b549-1fa4a7225ab0\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          const tcStr = JSON.stringify(tc);
          if (tcStr.toLowerCase().includes('audit_questions') || tcStr.toLowerCase().includes('audit')) {
            console.log(`=== Step ${obj.step_index} | Tool: ${tc.name} ===`);
            console.log(tcStr.substring(0, 1000));
            console.log('=====================================\n');
          }
        }
      }
    } catch (e) {}
  }
}

run();
