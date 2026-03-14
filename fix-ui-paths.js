const fs = require('fs');
const path = require('path');

function replaceInDir(dir, pattern, replacement) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath, pattern, replacement);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(pattern)) {
        console.log(`Fixing ${fullPath}`);
        // Calculate relative path to lib/utils
        const depth =
          fullPath.split(path.sep).length -
          path.join(__dirname, 'packages', 'ui', 'src').split(path.sep).length;
        let rel = '../'.repeat(depth - 1) + 'lib/utils';
        if (depth <= 1) rel = './lib/utils';

        // Simpler: just match components/atoms -> ../../lib/utils
        // components/organisms -> ../../lib/utils
        let newRel = '../../lib/utils';
        if (fullPath.includes('organisms')) newRel = '../../lib/utils';

        const newContent = content.replace(new RegExp(pattern, 'g'), newRel);
        fs.writeFileSync(fullPath, newContent, 'utf8');
      }
    }
  }
}

const uiSrc = path.join(process.cwd(), 'packages', 'ui', 'src');
replaceInDir(uiSrc, '@/lib/utils', '../../lib/utils');
