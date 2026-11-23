import test from 'node:test';
import assert from 'node:assert/strict';
import { MixerSession } from '../src/mixer/session';

test('demo provides 26 coloured channels, local faders, AUXes and templates without network access', async () => {
  const storage = new Map<string, string>();
  const session = new MixerSession({ getItem: async key => storage.get(key) || null, setItem: async (key, value) => { storage.set(key, value); } },
    () => { throw Error('Demo must not open a real socket'); },
    (async () => { throw Error('Demo must not fetch a server'); }) as typeof fetch);
  try {
    await session.startDemo();
    // The demo starts on No AUX like any mixer; choose a mix to load levels.
    session.preferences({ selectedAux: 1 });
    const deadline = Date.now() + 2000;
    while (Object.keys(session.mixer.state.values).length < 26 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(session.state.demo, true);
    assert.equal(session.mixer.state.config?.channels.length, 26);
    // Vocals, MC and playback carry desk colours; the band is uncoloured.
    const colour = (label: string) => session.mixer.state.config?.channels.find(c => c.label === label)?.colour;
    assert.equal(colour('Vox 1'), '#e5484d');
    assert.equal(colour('MC'), '#f5c518');
    assert.equal(colour('Kick'), undefined);
    assert.equal(session.mixer.state.config?.aux.length, 4);
    assert.equal(Object.keys(session.mixer.state.values).length, 26);
    const token = session.mixer.beginDrag(1)!;
    session.mixer.drag(token, 0.8); session.mixer.flush(token);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(session.mixer.state.values[1], 5.2);
    session.setChannelHidden(1, true);
    assert.deepEqual(session.state.preferences.hiddenByAux['1'], [1]);
    const templates = await session.templates();
    await session.applyTemplate(templates[1].id);
    // The Vocals template puts the singers first: Vox 1 is channel 19.
    assert.equal(session.state.preferences.channelOrder[0], 19);
    // A template sets the layout only; the musician stays on the mix they chose.
    assert.equal(session.state.preferences.selectedAux, 1);
    // A template is one layout for any mix: its hidden channels apply to every mix
    // and its groups are all-mix groups, replacing the phone's.
    assert.deepEqual(session.state.preferences.hiddenByAux, { '1': [25], '2': [25], '3': [25], '4': [25] });
    assert.deepEqual(session.state.preferences.globalGroups.map(group => group.name), ['Backing vocals', 'Drums', 'Tracks']);
    // Full band groups each section of the band.
    await session.applyTemplate(templates[0].id);
    assert.deepEqual(session.state.preferences.globalGroups.map(group => group.name), ['Drums', 'Guitars', 'Keys', 'Tracks', 'Vocals']);
    assert.deepEqual(session.state.preferences.globalGroups[0].members, [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.deepEqual(session.state.preferences.groupsByAux, {});
    assert.equal(session.state.recent.length, 0);
    assert.equal(session.state.lastServer, null);
  } finally { session.disconnect(); }
  assert.equal(session.state.demo, false);
});
