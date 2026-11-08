import test from 'node:test';
import assert from 'node:assert/strict';
import { MixerSession } from '../src/mixer/session';
import { positionToDb } from '../src/mixer/model';

test('demo provides 20 channels, local faders, AUXes and templates without network access', async () => {
  const storage = new Map<string, string>();
  const session = new MixerSession({ getItem: async key => storage.get(key) || null, setItem: async (key, value) => { storage.set(key, value); } },
    () => { throw Error('Demo must not open a real socket'); },
    (async () => { throw Error('Demo must not fetch a server'); }) as typeof fetch);
  try {
    await session.startDemo();
    const deadline = Date.now() + 2000;
    while (Object.keys(session.mixer.state.values).length < 20 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(session.state.demo, true);
    assert.equal(session.mixer.state.config?.channels.length, 20);
    assert.equal(session.mixer.state.config?.aux.length, 4);
    assert.equal(Object.keys(session.mixer.state.values).length, 20);
    const token = session.mixer.beginDrag(1)!;
    session.mixer.drag(token, 0.8); session.mixer.flush(token);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(session.mixer.state.values[1], positionToDb(0.8));
    session.setChannelHidden(1, true);
    assert.deepEqual(session.state.preferences.hiddenByAux['1'], [1]);
    const templates = await session.templates();
    await session.applyTemplate(templates[1].id);
    assert.equal(session.state.preferences.channelOrder[0], 15);
    assert.equal(session.state.preferences.selectedAux, 2);
    assert.equal(session.state.recent.length, 0);
    assert.equal(session.state.lastServer, null);
  } finally { session.disconnect(); }
  assert.equal(session.state.demo, false);
});
