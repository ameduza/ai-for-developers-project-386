import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { parseDocument } from 'yaml';

const requiredPermissions = ['contents', 'issues', 'pull-requests'];

function parseJson(document, name, errors) {
  try {
    return JSON.parse(document);
  } catch (error) {
    errors.push(`${name} is not valid JSON: ${error.message}`);
    return undefined;
  }
}

function parseYaml(document, name, errors) {
  const parsed = parseDocument(document);
  if (parsed.errors.length > 0) {
    errors.push(`${name} is not valid YAML: ${parsed.errors[0].message}`);
    return undefined;
  }

  return parsed.toJS();
}

function validateReleaseConfiguration({
  workflow,
  config,
  manifest,
  packageJson,
  lockfile,
}) {
  const errors = [];
  const workflowDocument = parseYaml(workflow, 'release workflow', errors);
  const configDocument = parseJson(
    config,
    'release-please configuration',
    errors,
  );
  const manifestDocument = parseJson(
    manifest,
    'release-please manifest',
    errors,
  );
  const packageDocument = parseJson(
    packageJson,
    'root package metadata',
    errors,
  );
  const lockfileDocument = parseJson(
    lockfile,
    'root lockfile metadata',
    errors,
  );

  if (workflowDocument) {
    const push = workflowDocument.on?.push;
    const branches = Array.isArray(push?.branches) ? push.branches : [];
    if (!branches.includes('main')) {
      errors.push('release workflow must run on pushes to main.');
    }

    for (const permission of requiredPermissions) {
      if (workflowDocument.permissions?.[permission] !== 'write') {
        errors.push(`release workflow must declare ${permission}: write.`);
      }
    }
  }

  if (configDocument) {
    const packages = configDocument.packages;
    const packagePaths =
      packages && typeof packages === 'object' ? Object.keys(packages) : [];
    if (packagePaths.length !== 1 || packagePaths[0] !== '.') {
      errors.push(
        'release-please configuration must contain exactly one package at the repository root (.).',
      );
    }
    if (packages?.['.']?.['release-type'] !== 'node') {
      errors.push('release-please root package must use release-type: node.');
    }
    if (!/^[0-9a-f]{40}$/i.test(configDocument['bootstrap-sha'] ?? '')) {
      errors.push(
        'release-please configuration must define bootstrap-sha as a full 40-character hexadecimal commit SHA.',
      );
    }
  }

  const manifestVersion = manifestDocument?.['.'];
  const packageVersion = packageDocument?.version;
  const lockfileVersion = lockfileDocument?.packages?.['']?.version;
  if (manifestVersion !== packageVersion) {
    errors.push(
      'release-please manifest version must match the root package version.',
    );
  }
  if (manifestVersion !== lockfileVersion) {
    errors.push(
      'release-please manifest version must match the root lockfile version.',
    );
  }

  return errors;
}

async function main() {
  const root = process.argv[2] === '--root' ? process.argv[3] : '.';
  const [workflow, config, manifest, packageJson, lockfile] = await Promise.all(
    [
      readFile(resolve(root, '.github/workflows/release-please.yml'), 'utf8'),
      readFile(resolve(root, 'release-please-config.json'), 'utf8'),
      readFile(resolve(root, '.release-please-manifest.json'), 'utf8'),
      readFile(resolve(root, 'package.json'), 'utf8'),
      readFile(resolve(root, 'package-lock.json'), 'utf8'),
    ],
  );
  const errors = validateReleaseConfiguration({
    workflow,
    config,
    manifest,
    packageJson,
    lockfile,
  });

  if (errors.length > 0) {
    console.error('Release configuration validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log('Release configuration is valid.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
