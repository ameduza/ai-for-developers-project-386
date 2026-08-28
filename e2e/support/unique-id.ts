import { randomUUID } from 'node:crypto';
import type { TestInfo } from '@playwright/test';

export function createUniqueE2EId(testInfo: TestInfo) {
  return [
    Date.now(),
    testInfo.parallelIndex,
    testInfo.retry,
    randomUUID().slice(0, 8),
  ].join('-');
}
