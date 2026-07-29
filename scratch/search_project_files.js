const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'scratch') continue;
      searchDir(filePath);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.md' || ext === '.txt' || ext === '.json' || ext === '.ts' || ext === '.tsx' || ext === '.js') {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.toLowerCase().includes('faq') || content.toLowerCase().includes('help/faq')) {
            console.log(`FOUND MATCH in file: ${filePath}`);
            // print lines
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes('faq') || lines[i].toLowerCase().includes('help/faq')) {
                console.log(`  Line ${i + 1}: ${lines[i].trim()}`);
              }
            }
          }
        } catch (e) {}
      }
    }
  }
}

console.log('Searching project files...');
searchDir('C:\\Users\\kgnan\\OneDrive\\Desktop\\siccasync-complete');
console.log('Search finished.');
