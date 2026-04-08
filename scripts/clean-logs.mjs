import fs from 'fs';

const PATH = 'c:\\Users\\manso\\OneDrive\\Documents\\Validiant-v2\\validiant-v2\\apps\\web\\src\\actions\\auth.actions.ts';
let content = fs.readFileSync(PATH, 'utf8');

// Replace standard console.log lines
content = content.replace(/^.*console\.(log|debug|info).*$/gm, '');
// Replace eslint-disable lines for console
content = content.replace(/^.*eslint-disable-next-line no-console.*$/gm, '');

fs.writeFileSync(PATH, content);
console.log('Cleaned logs in auth.actions.ts');
