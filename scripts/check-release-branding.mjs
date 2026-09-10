import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const restrictedTerms = [
  Buffer.from('bmNhbWM=', 'base64').toString('utf8'),
  Buffer.from('5paw5Y2O6LWE5Lqn', 'base64').toString('utf8'),
];

function collectFiles(entry, files) {
  const fullPath = resolve(entry);
  if (!existsSync(fullPath)) {
    throw new Error(`Scan target does not exist: ${entry}`);
  }

  const stat = lstatSync(fullPath);
  if (stat.isDirectory()) {
    for (const child of readdirSync(fullPath)) {
      collectFiles(resolve(fullPath, child), files);
    }
    return;
  }

  if (stat.isFile()) files.push(fullPath);
}

function trackedFiles() {
  const output = execFileSync('git', ['ls-files', '-z']);
  return output
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map((file) => resolve(file));
}

const inputs = process.argv.slice(2);
const files = [];

if (inputs.length === 0) {
  files.push(...trackedFiles());
} else {
  for (const input of inputs) collectFiles(input, files);
}

const violations = [];

for (const file of files) {
  const normalizedPath = file.toLocaleLowerCase();
  const bytes = readFileSync(file);
  const utf8Content = bytes.toString('utf8').toLocaleLowerCase();
  const utf16Content = bytes.toString('utf16le').toLocaleLowerCase();

  restrictedTerms.forEach((term, index) => {
    const normalizedTerm = term.toLocaleLowerCase();
    if (
      normalizedPath.includes(normalizedTerm) ||
      utf8Content.includes(normalizedTerm) ||
      utf16Content.includes(normalizedTerm)
    ) {
      violations.push({ file, rule: index + 1 });
    }
  });
}

if (violations.length > 0) {
  console.error('Release branding compliance check failed:');
  for (const violation of violations) {
    console.error(`- restricted rule ${violation.rule}: ${violation.file}`);
  }
  process.exit(1);
}

console.log(`Release branding compliance check passed (${files.length} files scanned).`);
