import fs from 'fs';
import path from 'path';

function findAndReplaceSync(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findAndReplaceSync(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const original = content;

      // text-white -> text-[var(--color-text-base)]
      // Instead of raw var() we should use the Tailwind mapped token since css-vars.css maps them 
      // text-white -> text-text-base is perfect if we have that in tailwind.config.ts.
      // Assuming we have text-text-base mapped or just use text-[var(--color-text-base)]
      content = content.replace(/\btext-white\b/g, 'text-[var(--color-text-base)]');
      
      // text-white/XX
      content = content.replace(/\btext-white\/20\b/g, 'text-[var(--color-text-muted)]');
      content = content.replace(/\btext-white\/40\b/g, 'text-[var(--color-text-muted)]');
      content = content.replace(/\btext-white\/60\b/g, 'text-[var(--color-text-muted)]');
      content = content.replace(/\btext-white\/10\b/g, 'text-[var(--color-text-muted)]/50');
      
      // bg-white/5
      content = content.replace(/\bbg-white\/5\b/g, 'bg-[var(--color-surface-muted)]/50');
      content = content.replace(/\bbg-white\/10\b/g, 'bg-[var(--color-surface-muted)]');
      
      // border-white/XX
      content = content.replace(/\bborder-white\/\[0\.03\]\b/g, 'border-[var(--color-border-base)]/10');
      content = content.replace(/\bborder-white\/5\b/g, 'border-[var(--color-border-base)]/20');
      content = content.replace(/\bborder-white\/10\b/g, 'border-[var(--color-border-base)]/40');
      content = content.replace(/\bborder-white\/20\b/g, 'border-[var(--color-border-base)]');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated:', fullPath);
      }
    }
  }
}

const targetDir = 'c:\\Users\\manso\\OneDrive\\Documents\\Validiant-v2\\validiant-v2\\apps\\web\\src';
console.log('Starting replace in', targetDir);
findAndReplaceSync(targetDir);
console.log('Done!');
