import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MixerSession } from '../src/mixer/session';
import { readMixerCode } from '../src/connection';
import type { Socket } from '../src/mixer/client';

test('a scanned mixer code may carry the PIN; typed addresses may not', () => {
  assert.deepEqual(readMixerCode('http://192.168.1.100:8082/#pin=482913'), { address: 'http://192.168.1.100:8082/', pin: '482913' });
  assert.deepEqual(readMixerCode('http://192.168.1.100:8082/'), { address: 'http://192.168.1.100:8082/', pin: null });
  assert.throws(() => readMixerCode('http://192.168.1.100:8082/#pin=12'));
  assert.throws(() => readMixerCode('http://192.168.1.100:8082/#other'));
});

test('a scanned PIN pairs without prompting, and a wrong one falls back to the prompt', async () => {
  const data = new Map<string, string>();
  const sockets: (Socket & { sent: any[] })[] = [];
  const fetcher = (async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/pair')) return JSON.parse(String(init?.body)).pin === '482913'
      ? Response.json({ paired: true, token: 'a'.repeat(64) }) : Response.json({ error: 'Incorrect PIN.' }, { status: 401 });
    return Response.json({ url, qr: 'data:image/png;base64,AAA' });
  }) as typeof fetch;
  const session = new MixerSession({ getItem: async key => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); } },
    () => { const socket = { readyState: 1, sent: [] as any[], send(value: string) { this.sent.push(JSON.parse(value)); }, close() {},
      onopen: null, onclose: null, onmessage: null, onerror: null } as Socket & { sent: any[] }; sockets.push(socket); return socket; }, fetcher);
  const settle = () => new Promise(resolve => setTimeout(resolve, 20));
  await session.hydrate(); session.setSettings({ nickname: 'Joe' });
  await session.connect('mixer.local', '482913');
  sockets.at(-1)!.onopen?.();
  sockets.at(-1)!.onmessage?.({ data: JSON.stringify({ auth: 'required' }) });
  await settle();
  assert.equal(session.state.pinPrompt, null);
  sockets.at(-1)!.onopen?.();
  assert.equal(sockets.at(-1)!.sent[0].auth.token, 'a'.repeat(64));

  await session.connect('mixer.local', '000000');
  sockets.at(-1)!.onopen?.();
  sockets.at(-1)!.onmessage?.({ data: JSON.stringify({ auth: 'revoked' }) });
  await settle();
  assert.deepEqual(session.state.pinPrompt, { revoked: true });
  session.disconnect();
});
