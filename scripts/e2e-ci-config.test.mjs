import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';

async function loadPlaywrightConfig(ci) {
  const previousCi = process.env.CI;

  if (ci) {
    process.env.CI = 'true';
  } else {
    delete process.env.CI;
  }

  try {
    const configUrl = new URL('../playwright.config.mjs', import.meta.url);
    configUrl.searchParams.set('ci', String(ci));
    return (await import(configUrl.href)).default;
  } finally {
    if (previousCi === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previousCi;
    }
  }
}

test('Playwright retains failure diagnostics without recording routine video', async () => {
  const localConfig = await loadPlaywrightConfig(false);
  const ciConfig = await loadPlaywrightConfig(true);

  assert.equal(localConfig.retries, 0);
  assert.equal(ciConfig.retries, 1);
  assert.equal(ciConfig.use.trace, 'retain-on-failure');
  assert.equal(ciConfig.use.screenshot, 'only-on-failure');
  assert.equal(ciConfig.use.video, 'off');
  assert.deepEqual(
    ciConfig.projects.map(({ name }) => name),
    ['chromium'],
  );
});

test('verification workflow runs Chromium E2E tests and preserves failures', async () => {
  const workflowSource = await readFile(
    new URL('../.github/workflows/verify.yml', import.meta.url),
    'utf8',
  );
  const workflow = parse(workflowSource);

  assert.ok(Object.hasOwn(workflow.on, 'push'));
  assert.ok(Object.hasOwn(workflow.on, 'pull_request'));

  const verifyCommands = workflow.jobs.verify.steps
    .map((step) => step.run)
    .filter(Boolean);
  assert.deepEqual(verifyCommands, [
    'npm ci',
    'npm run check:release-config',
    'npm run generate:api --workspace client',
    'git diff --exit-code',
    'npm run typecheck',
    'npm run lint',
    'npm run format:check',
    'npm run test',
  ]);

  const e2eSteps = workflow.jobs.e2e.steps;
  assert.ok(e2eSteps.some(({ run }) => run === 'npm ci'));
  assert.ok(
    e2eSteps.some(
      ({ run }) => run === 'npx playwright install --with-deps chromium',
    ),
  );

  const testStep = e2eSteps.find(({ run }) => run === 'npm run test:e2e');
  assert.ok(testStep);
  assert.equal(testStep['continue-on-error'], undefined);

  const artifactStep = e2eSteps.find(
    ({ uses }) => uses === 'actions/upload-artifact@v4',
  );
  assert.equal(artifactStep.if, 'failure()');
  assert.equal(artifactStep.with.path, 'test-results/');
});
