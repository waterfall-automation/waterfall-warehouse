const fs = require('fs');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\5ca4a87a-e29d-49b8-8cc8-8f421f548349\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.step_index === 493) {
        console.log('=== STEP 493 USER INPUT ===');
        const text = obj.content;
        
        // Find TASK 4 and TASK 5 positions
        const t4Idx = text.indexOf('=== TASK 4:');
        const t5Idx = text.indexOf('=== TASK 5:');
        
        if (t4Idx >= 0) {
          if (t5Idx >= 0) {
            console.log('--- TASK 4 ---');
            console.log(text.substring(t4Idx, t5Idx));
            console.log('--- TASK 5 ---');
            console.log(text.substring(t5Idx, t5Idx + 2000));
          } else {
            console.log(text.substring(t4Idx, t4Idx + 2000));
          }
        } else {
          console.log('Could not find TASK 4 marker. Searching for Task 4 / Task 5...');
          const t4 = text.indexOf('Task 4');
          const t5 = text.indexOf('Task 5');
          console.log('t4:', t4, 't5:', t5);
          if (t4 >= 0) console.log(text.substring(t4, t4 + 1000));
        }
      }
    } catch (e) {}
  }
}

run();
