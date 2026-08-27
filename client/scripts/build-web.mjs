import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, '..');
const require = createRequire(path.join(clientRoot, 'package.json'));
const viteEntry = require.resolve('vite');
const vitePackageRoot = path.resolve(viteEntry, '..', '..', '..');
const viteBin = path.join(vitePackageRoot, 'bin', 'vite.js');
const workspaceModulesRoot = path.dirname(vitePackageRoot);
const env = { ...process.env };

if (!env.VITE_API_BASE_URL) {
  env.VITE_API_BASE_URL = 'http://127.0.0.1:4010';
}

let buildRoot = clientRoot;
let temporaryRoot;

if (clientRoot.includes('#')) {
  temporaryRoot = mkdtempSync(
    path.join(os.tmpdir(), 'calendar-booking-client-build-'),
  );
  buildRoot = path.join(temporaryRoot, 'client');
  const sourceDist = path.join(clientRoot, 'dist');
  const sourceModules = path.join(clientRoot, 'node_modules');

  cpSync(clientRoot, buildRoot, {
    recursive: true,
    filter: (source) => source !== sourceDist && source !== sourceModules,
  });
  symlinkSync(
    workspaceModulesRoot,
    path.join(temporaryRoot, 'node_modules'),
    'junction',
  );
}

try {
  const result = spawnSync(process.execPath, [viteBin, 'build'], {
    cwd: buildRoot,
    env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  } else if (temporaryRoot) {
    const builtDist = path.join(buildRoot, 'dist');
    const targetDist = path.join(clientRoot, 'dist');

    if (!existsSync(builtDist)) {
      throw new Error('Vite completed without producing a dist directory');
    }

    if (
      path.dirname(targetDist) !== clientRoot ||
      path.basename(targetDist) !== 'dist'
    ) {
      throw new Error('Refusing to replace an unexpected build directory');
    }

    rmSync(targetDist, { recursive: true, force: true });
    cpSync(builtDist, targetDist, { recursive: true });
  }
} finally {
  if (temporaryRoot) {
    const temporaryParent = path.resolve(os.tmpdir());
    const resolvedTemporaryRoot = path.resolve(temporaryRoot);
    const temporaryDirectoryName = path.basename(resolvedTemporaryRoot);

    if (
      path.dirname(resolvedTemporaryRoot) !== temporaryParent ||
      !temporaryDirectoryName.startsWith('calendar-booking-client-build-')
    ) {
      throw new Error('Refusing to remove an unexpected temporary directory');
    }

    rmSync(resolvedTemporaryRoot, { recursive: true, force: true });
  }
}
