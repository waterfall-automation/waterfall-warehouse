const fs = require('fs');

const logFile = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain\\5ca4a87a-e29d-49b8-8cc8-8f421f548349\\.system_generated\\logs\\transcript_full.jsonl';

async function run() {
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.content && obj.content.includes('TASK 4')) {
        const text = obj.content;
        
        // Find TASK 4 and TASK 5 positions
        const task4Idx = text.indexOf('=== TASK 4:');
        const task5Idx = text.indexOf('=== TASK 5:');
        
        if (task4Idx >= 0) {
          console.log('--- TASK 4 SECTION ---');
          if (task5Idx >= 0) {
            console.log(text.substring(task4Idx, task5Idx));
            console.log('--- TASK 5 SECTION ---');
            console.log(text.substring(task5Idx, task5Idx + 2000));
          } else {
            console.log(text.substring(task4Idx, task4Idx + 2000));
          }
        } else {
          // Let's print occurrences of Batch D and FAQ
          const dIdx = text.indexOf('Batch D');
          const faqIdx = text.indexOf('FAQ');
          console.log('dIdx:', dIdx, 'faqIdx:', faqIdx);
          console.log(text.substring(Math.max(0, dIdx - 200), dIdx + 1500));
        }
      }
    } catch (e) {}
  }
}

run();
