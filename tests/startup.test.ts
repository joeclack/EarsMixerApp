import test from 'node:test';
import assert from 'node:assert/strict';
import { findStartupMixers } from '../src/discovery/startup';
import type { DiscoveryNative } from '../src/discovery/browser';

test('startup collects zero, one or multiple desks before choosing; stops browsing', async () => {
  for (const count of [0, 1, 2]) {
    const handlers: Record<string, (value: any) => void> = {};
    let stopped = false;
    const native: DiscoveryNative = {
      addListener(name, listener) { handlers[name] = listener; return { remove() {} }; },
      async start() {
        for (let i = 0; i < count; i++) handlers.onFound({ id: 'desk-' + i, name: 'Desk ' + i, addresses: ['192.168.1.' + (10 + i)], port: 80 });
      },
      async stop() { stopped = true; },
    };
    const mixers = await findStartupMixers(native, [], new AbortController().signal, 5);
    assert.equal(mixers.length, count);
    assert(stopped);
  }
});
