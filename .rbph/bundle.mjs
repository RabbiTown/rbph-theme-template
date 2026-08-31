// RBPH template infrastructure. Theme developers should not modify this file.

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const name = String(pkg.name ?? 'rbph-theme')
  .replace(/^@/, '')
  .replaceAll('/', '-');
const output = `${name}-${String(pkg.version ?? '0.0.0')}.zip`;
const tempDir = mkdtempSync(join(tmpdir(), 'rbph-theme-'));
try {
  rmSync(join(dist, output), { force: true });
  execFileSync('zip', ['-r', join(tempDir, output), '.'], { cwd: dist, stdio: 'inherit' });
  copyFileSync(join(tempDir, output), join(dist, output));
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
