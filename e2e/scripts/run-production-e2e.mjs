import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolveTargetSettings } from '../support/execution-target.js';

/** @typedef {'SIGHUP' | 'SIGINT' | 'SIGTERM'} CleanupSignal */
/** @typedef {{ code: number, signal: NodeJS.Signals | null }} CommandResult */

const productionSettings = resolveTargetSettings('production', false);
if (productionSettings.topology.kind !== 'docker-image') {
  throw new Error('Production E2E target must use the Docker image topology');
}

const { browserOrigin } = productionSettings;
const { containerName, imageTag, port, readinessPath } =
  productionSettings.topology;
const serviceUrl = `${browserOrigin}${readinessPath}`;
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const e2eRoot = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const playwrightCli = require.resolve('@playwright/test/cli');
/** @type {Set<import('node:child_process').ChildProcess>} */
const activeChildren = new Set();

/** @type {CleanupSignal | undefined} */
let receivedSignal;
let containerCleanupRequired = false;

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import('node:child_process').SpawnOptions} [options]
 * @param {boolean} [interruptible]
 * @returns {{
 *   child: import('node:child_process').ChildProcess,
 *   completion: Promise<CommandResult>,
 * }}
 */
function startCommand(command, args, options = {}, interruptible = true) {
  const child = spawn(command, args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    ...options,
  });
  if (interruptible) {
    activeChildren.add(child);
  }

  /** @type {Promise<CommandResult>} */
  const completion = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (interruptible) {
        activeChildren.delete(child);
      }
      resolve({ code: code ?? 1, signal });
    });
  });

  return { child, completion };
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import('node:child_process').SpawnOptions} [options]
 * @param {boolean} [interruptible]
 */
async function runCommand(command, args, options, interruptible = true) {
  const result = await startCommand(command, args, options, interruptible)
    .completion;

  if (result.code !== 0) {
    throw new Error(
      `${command} ${args[0]} failed${result.signal ? ` with signal ${result.signal}` : ` with exit code ${result.code}`}`,
    );
  }
}

/** @param {unknown} error */
function isMissingExecutable(error) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

/** @param {{ required?: boolean }} [options] */
async function removeContainer({ required = false } = {}) {
  try {
    await runCommand(
      'docker',
      ['rm', '--force', containerName],
      {
        stdio: 'ignore',
      },
      false,
    );
  } catch (error) {
    if (isMissingExecutable(error) || required) {
      throw error;
    }
  }
}

/** @returns {Promise<void>} */
async function waitForService() {
  const deadline = Date.now() + 180_000;

  while (Date.now() < deadline) {
    if (receivedSignal) {
      throw new Error(`Production E2E interrupted by ${receivedSignal}`);
    }

    try {
      const response = await fetch(serviceUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // The image is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Production image did not become ready at ${serviceUrl}`);
}

/** @type {CleanupSignal[]} */
const cleanupSignals = ['SIGINT', 'SIGTERM', 'SIGHUP'];

for (const signal of cleanupSignals) {
  process.once(signal, () => {
    receivedSignal = signal;
    for (const child of activeChildren) {
      child.kill(signal);
    }
  });
}

let exitCode = 1;

try {
  await removeContainer();
  await runCommand('docker', [
    'build',
    '--tag',
    imageTag,
    '--file',
    'Dockerfile',
    repositoryRoot,
  ]);
  await runCommand(
    'docker',
    [
      'create',
      '--name',
      containerName,
      '--env',
      `PORT=${port}`,
      '--publish',
      `${port}:${port}`,
      imageTag,
    ],
    undefined,
    false,
  );
  containerCleanupRequired = true;

  if (receivedSignal) {
    throw new Error(`Production E2E interrupted by ${receivedSignal}`);
  }

  await runCommand('docker', ['start', containerName]);

  const logCompletion = startCommand('docker', [
    'logs',
    '--follow',
    containerName,
  ]).completion;
  void logCompletion.catch((error) => {
    if (!receivedSignal) {
      console.error(error);
    }
  });
  await waitForService();

  const testResult = await startCommand(
    process.execPath,
    [playwrightCli, 'test', ...process.argv.slice(2)],
    {
      cwd: e2eRoot,
      env: { ...process.env, E2E_TARGET: 'production' },
    },
  ).completion;
  exitCode = testResult.code;
} catch (error) {
  if (!receivedSignal) {
    console.error(error);
  }
} finally {
  if (containerCleanupRequired) {
    await removeContainer({ required: true });
  }
}

if (receivedSignal) {
  /** @type {Record<CleanupSignal, number>} */
  const signalExitCodes = { SIGHUP: 129, SIGINT: 130, SIGTERM: 143 };
  process.exitCode = signalExitCodes[receivedSignal];
} else {
  process.exitCode = exitCode;
}
