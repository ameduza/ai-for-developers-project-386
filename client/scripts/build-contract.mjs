import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..');

execSync('npm run build:contract --workspace typespec', {
  cwd: repoRoot,
  stdio: 'inherit',
});
