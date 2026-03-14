const fs = require('fs');
const path = require('path');

function fixAll(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixAll(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Fix imports
      if (content.includes('../../lib/utils')) {
        content = content.replace(/\.\.\/\.\.\/lib\/utils/g, '@/lib/utils');
        changed = true;
      }
      if (content.includes('../../../lib/utils')) {
        content = content.replace(
          /\.\.\/\.\.\/\.\.\/lib\/utils/g,
          '@/lib/utils'
        );
        changed = true;
      }

      if (changed) {
        console.log(`Updated ${fullPath}`);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

const uiSrc = path.join(process.cwd(), 'packages', 'ui', 'src');
fixAll(uiSrc);
console.log('Done fixing aliases.');
