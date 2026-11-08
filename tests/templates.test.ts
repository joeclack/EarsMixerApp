import test from 'node:test';
import assert from 'node:assert/strict';
import { MixerSession } from '../src/mixer/session';
import { emptyPreferences } from '../src/mixer/model';
import type { Socket } from '../src/mixer/client';

test('server templates replace local layout, persist and never recall audio levels', async () => {
  const id = 'a'.repeat(64), saved = new Map<string, string>(), messages: any[] = [];
  const config = { ...emptyPreferences(), selectedAux: 2, channelOrder: [2, 1], favouritesByAux: { '2': { channels: [2], enabled: true } }, levels: [10], pan: 0.9 };
  const socket: Socket = { readyState: 1, onopen: null, onclose: null, onerror: null, onmessage: null, close() {}, send: raw => messages.push(JSON.parse(raw)) };
  const session = new MixerSession({ getItem: async key => saved.get(key) || null, setItem: async (key, value) => { saved.set(key, value); } }, () => socket,
    (async (url: string) => Response.json(url.endsWith('/api/connection') ? { url, qr: 'data:image/png;base64,AAA' } : url.endsWith('/api/templates') ? { templates: [{ id, name: 'Drums' }] } : { id, name: 'Drums', config })) as typeof fetch);
  try {
    await session.connect('mixer.local');
    socket.onopen?.();
    assert.deepEqual(await session.templates(), [{ id, name: 'Drums' }]);
    await session.applyTemplate(id);
    assert.deepEqual(session.state.preferences.channelOrder, [2, 1]);
    assert.deepEqual(session.state.preferences.favouritesByAux, config.favouritesByAux);
    assert.equal(session.state.preferences.selectedAux, 2);
    assert.equal(session.state.selectedTemplate?.name, 'Drums');
    session.preferences({ channelOrder: [1, 2] });
    assert(!('levels' in session.state.preferences));
    assert(messages.every(message => !message.address || message.address.endsWith('/?')));
    session.disconnect();
    await session.connect('mixer.local');
    assert.equal(session.state.selectedTemplate?.name, 'Drums');
    assert.deepEqual(JSON.parse(saved.get('earsmixer.native.profile:http://mixer.local/')!).preferences.channelOrder, [1, 2]);
  } finally {
    session.disconnect();
  }
});
