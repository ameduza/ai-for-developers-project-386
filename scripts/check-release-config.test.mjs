import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const validConfiguration = {
  workflow: `name: release-please
on:
  push:
    branches:
      - main
permissions:
  contents: write
  issues: write
  pull-requests: write
`,
  config: JSON.stringify({
    'bootstrap-sha': '185a1d56bb8b82690eb869a3a67d260f331e24f4',
    packages: { '.': { 'release-type': 'node' } },
  }),
  manifest: JSON.stringify({ '.': '1.0.0' }),
  packageJson: JSON.stringify({ version: '1.0.0' }),
  lockfile: JSON.stringify({ packages: { '': { version: '1.0.0' } } }),
};

async function runChecker(overrides = {}) {
  const root = await mkdtemp(join(tmpdir(), 'release-config-'));
  const configuration = { ...validConfiguration, ...overrides };
  await mkdir(join(root, '.github', 'workflows'), { recursive: true });
  await Promise.all([
    writeFile(
      join(root, '.github', 'workflows', 'release-please.yml'),
      configuration.workflow,
    ),
    writeFile(join(root, 'release-please-config.json'), configuration.config),
    writeFile(
      join(root, '.release-please-manifest.json'),
      configuration.manifest,
    ),
    writeFile(join(root, 'package.json'), configuration.packageJson),
    writeFile(join(root, 'package-lock.json'), configuration.lockfile),
  ]);

  try {
    const result = spawnSync(
      process.execPath,
      [
        process.env.npm_execpath,
        'run',
        'check:release-config',
        '--',
        '--root',
        root,
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      },
    );
    assert.equal(result.error, undefined, result.error?.message);
    return result;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('accepts the repository root Node release configuration', async () => {
  const result = await runChecker();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Release configuration is valid/);
});

test('reports malformed configuration documents', async () => {
  const result = await runChecker({ config: '{', workflow: 'permissions: [}' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /release-please configuration is not valid JSON/);
  assert.match(result.stderr, /release workflow is not valid YAML/);
});

test('requires pushes to main and explicit release permissions', async () => {
  const result = await runChecker({
    workflow: validConfiguration.workflow
      .replace('- main', '- develop')
      .replace('  issues: write\n', ''),
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /pushes to main/);
  assert.match(result.stderr, /issues: write/);
});

test('requires exactly one root Node package entry', async () => {
  const result = await runChecker({
    config: JSON.stringify({
      'bootstrap-sha': '185a1d56bb8b82690eb869a3a67d260f331e24f4',
      packages: {
        '.': { 'release-type': 'python' },
        client: { 'release-type': 'node' },
      },
    }),
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exactly one package/);
  assert.match(result.stderr, /release-type.*node/);
});

test('requires a missing or abbreviated bootstrap SHA and matching root versions', async () => {
  for (const bootstrapSha of [undefined, '185a1d5']) {
    const result = await runChecker({
      config: JSON.stringify({
        packages: { '.': { 'release-type': 'node' } },
        ...(bootstrapSha ? { 'bootstrap-sha': bootstrapSha } : {}),
      }),
      lockfile: JSON.stringify({ packages: { '': { version: '1.0.1' } } }),
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /40-character hexadecimal commit SHA/);
    assert.match(result.stderr, /manifest version.*lockfile version/);
  }
});
