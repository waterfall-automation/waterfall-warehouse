const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = 'C:\\Users\\kgnan\\.gemini\\antigravity-cli\\brain';

async function searchFile(filePath, folder) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lowerContent = content.toLowerCase();
    
    // Check for Section D and some numbers
    if (lowerContent.includes('section d') && (lowerContent.includes('40.') || lowerContent.includes('41.'))) {
      console.log(`=== FOUND MATCH IN FILE: ${filePath} ===`);
      // Find the occurrence and print some lines around it
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('section d') || lines[i].includes('40.') || lines[i].includes('41.')) {
          console.log(`Line ${i}:`, lines[i].substring(0, 1000));
        }
      }
      console.log('==================================================\n');
      return true;
    }
  } catch (err) {}
  return false;
}

async function run() {
  const folders = fs.readdirSync(brainDir);
  for (const folder of folders) {
    const logsDir = path.join(brainDir, folder, '.system_generated', 'logs');
    if (!fs.existsSync(logsDir)) continue;

    const files = fs.readdirSync(logsDir);
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      if (fs.statSync(filePath).isFile()) {
        const found = await searchFile(filePath, folder);
        if (found) {
          // Keep searching to find all occurrences
        }
      }
    }
  }
}

run();
