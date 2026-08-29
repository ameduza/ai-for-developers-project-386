import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveExecutionTarget,
  resolveTargetSettings,
} from './execution-target.js';

describe('E2E execution target', () => {
  it('uses development when no target is provided', () => {
    assert.equal(resolveExecutionTarget(undefined), 'development');
  });

  it('selects production explicitly', () => {
    assert.equal(resolveExecutionTarget('production'), 'production');
  });

  it('keeps the production listener and Docker topology together', () => {
    assert.deepEqual(resolveTargetSettings('production', false), {
      browserOrigin: 'http://localhost:4317',
      apiOrigin: 'http://localhost:4317/api',
      webServer: undefined,
      topology: {
        kind: 'docker-image',
        containerName: 'booking-service-e2e',
        imageTag: 'booking-service-e2e:local',
        port: '4317',
        readinessPath: '/owner',
      },
    });
  });

  it('rejects unknown targets', () => {
    assert.throws(
      () => resolveExecutionTarget('staging'),
      /E2E_TARGET must be "development" or "production"/,
    );
    assert.throws(
      () => resolveExecutionTarget('toString'),
      /E2E_TARGET must be "development" or "production"/,
    );
  });
});
