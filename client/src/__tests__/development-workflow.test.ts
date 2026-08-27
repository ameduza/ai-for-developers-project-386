import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

interface ClientPackage {
  scripts: Record<string, string>;
}

const clientPackage = JSON.parse(
  await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
) as ClientPackage;

describe('client development workflows', () => {
  it('runs the Booking Service and web client against the local service by default', () => {
    const command = clientPackage.scripts.dev;

    assert.match(command, /VITE_API_BASE_URL=http:\/\/localhost:3000/);
    assert.match(command, /\.\.\/server/);
    assert.match(command, /dev:web/);
    assert.match(command, /concurrently --kill-others/);
    assert.doesNotMatch(command, /prism|dev:mock/i);
  });

  it('keeps the Prism-backed client workflow available as an explicit command', () => {
    const command = clientPackage.scripts['dev:mock'];

    assert.match(command, /VITE_API_BASE_URL=http:\/\/127\.0\.0\.1:4010/);
    assert.match(command, /dev:mock-server/);
    assert.match(command, /dev:web/);
    assert.match(command, /concurrently --kill-others/);
    assert.match(clientPackage.scripts['dev:mock-server'], /prism mock/i);
  });
});
