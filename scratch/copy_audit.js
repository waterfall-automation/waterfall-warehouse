const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\kgnan\\Downloads\\waterfall-warehouse-audit-questions.md';
const dest = 'C:\\Users\\kgnan\\OneDrive\\Desktop\\siccasync-complete\\docs\\AUDIT_QUESTIONS.md';

const dir = path.dirname(dest);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.copyFileSync(src, dest);
console.log('Successfully copied AUDIT_QUESTIONS.md from Downloads to docs/AUDIT_QUESTIONS.md!');
