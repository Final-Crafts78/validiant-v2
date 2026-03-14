import * as fs from 'fs';
import * as path from 'path';

const tokens = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'tokens.json'), 'utf8')
);

function generateCSS() {
  let css = ':root {\n';

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    css += `  --spacing-${key}: ${value};\n`;
  });

  // Motion
  Object.entries(tokens.motion.duration).forEach(([key, value]) => {
    css += `  --motion-duration-${key}: ${value};\n`;
  });
  Object.entries(tokens.motion.easing).forEach(([key, value]) => {
    css += `  --motion-easing-${key}: ${value};\n`;
  });

  // Light Theme (Default)
  Object.entries(tokens.themes.light.colors).forEach(([group, values]) => {
    Object.entries(values as any).forEach(([key, value]) => {
      css += `  --color-${group}-${key}: ${value};\n`;
    });
  });
  css += '}\n\n';

  // Dark Theme
  css += '[data-theme="dark"] {\n';
  Object.entries(tokens.themes.dark.colors).forEach(([group, values]) => {
    Object.entries(values as any).forEach(([key, value]) => {
      css += `  --color-${group}-${key}: ${value};\n`;
    });
  });
  css += '}\n';

  fs.writeFileSync(path.join(__dirname, 'css-vars.css'), css);
  console.log('✅ Generated css-vars.css');
}

function generateTS() {
  const ts = `/**
 * Generated Theme Tokens for NativeWind / Tailwind
 */
export const themeTokens = ${JSON.stringify(tokens, null, 2)} as const;

export type ThemeTokens = typeof themeTokens;
`;

  fs.writeFileSync(path.join(__dirname, 'theme.ts'), ts);
  console.log('✅ Generated theme.ts');
}

generateCSS();
generateTS();
