import type { Socket } from './client';
import { emptyPreferences } from './model';
export const DEMO_URL = 'http://demo.earsmixer.invalid/';
// The demo desk. Colours are the main shades of the server's channel palette
// (lib/channel-colours.js), so the demo looks like a real desk. The band stays
// uncoloured and the vocals, MC and playback show off channel colours.
const RED = '#e5484d', ORANGE = '#f76b15', YELLOW = '#f5c518', GREEN = '#30a46c', BLUE = '#0090ff', PURPLE = '#8e4ec6', PINK = '#d6409f', GREY = '#80838d';
const channels: { label: string; colour?: string }[] = [
  { label: 'Kick' }, { label: 'Snare Top' }, { label: 'Snare Btm' }, { label: 'Hi-hat' },
  { label: 'Rack Tom' }, { label: 'Floor Tom' }, { label: 'OH L' }, { label: 'OH R' },
  { label: 'Bass' }, { label: 'Gtr 1' }, { label: 'Gtr 2' }, { label: 'Acoustic' }, { label: 'Keys L' }, { label: 'Keys R' },
  { label: 'Track L' }, { label: 'Track R' }, { label: 'Click' }, { label: 'Cues', colour: GREY },
  { label: 'Vox 1', colour: RED }, { label: 'Vox 2', colour: GREEN }, { label: 'Vox 3', colour: BLUE },
  { label: 'Vox 4', colour: ORANGE }, { label: 'Vox 5', colour: PURPLE }, { label: 'MC', colour: YELLOW },
  { label: 'Spotify', colour: PINK }, { label: 'Talkback', colour: GREY },
];
const CHANNEL_COUNT = channels.length;
// Channel numbers, 1-based, for the templates below.
const ch = (from: number, to = from) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const DRUMS = ch(1, 8), GUITARS = ch(10, 12), KEYS = ch(13, 14), TRACKS = ch(15, 16), VOCALS = ch(19, 23), BACKING_VOCALS = ch(20, 23);
export const demoTemplates = [{ id: 'd'.repeat(64), name: 'Full band' }, { id: 'e'.repeat(64), name: 'Vocals' }];
export function demoTemplate(id: string) {
  if (!demoTemplates.some(template => template.id === id)) throw new Error('Template not found.');
  const all = ch(1, CHANNEL_COUNT);
  if (id[0] === 'd') {
    // Full band: the desk's order, with each section on one group fader.
    return { ...emptyPreferences(), channelOrder: all, hidden: [],
      globalGroups: [{ id: 1, name: 'Drums', members: DRUMS }, { id: 2, name: 'Guitars', members: GUITARS }, { id: 3, name: 'Keys', members: KEYS },
        { id: 4, name: 'Tracks', members: TRACKS }, { id: 5, name: 'Vocals', members: VOCALS }] };
  }
  // Vocals: singers first, then the MC and what keeps them in time.
  const first = [...VOCALS, 24, 17, 18];
  return { ...emptyPreferences(), channelOrder: [...first, ...all.filter(n => !first.includes(n))],
    // One layout for any mix, like templates from the server.
    hidden: [25],
    globalGroups: [{ id: 1, name: 'Backing vocals', members: BACKING_VOCALS }, { id: 2, name: 'Drums', members: DRUMS }, { id: 3, name: 'Tracks', members: TRACKS }] };
}
// Implements the same protocol locally. No WebSocket or HTTP connection exists.
export function createDemoSocket(): Socket {
  let closed = false;
  let requestId = 0;
  const values = new Map<string, number>();
  const deliver = (message: object) => queueMicrotask(() => { if (!closed) socket.onmessage?.({ data: JSON.stringify(message) }); });
  const socket: Socket = {
    readyState: 0, onopen: null, onclose: null, onerror: null, onmessage: null,
    close() { closed = true; socket.readyState = 3; },
    send(raw) {
      if (closed) return;
      const message = JSON.parse(raw);
      // The demo engineer sees every request a few seconds after it is sent.
      if (message.request) {
        const id = ++requestId, at = Date.now();
        deliver({ requestSent: { id, kind: message.request.kind ?? null, text: String(message.request.text || ''), at } });
        setTimeout(() => deliver({ requestAcknowledged: { id } }), 3000);
        return;
      }
      const match = /^\/Input_Channels\/(\d+)\/Aux_Send\/(\d+)\/send_(level|pan|on)(\/\?)?$/.exec(message.address || '');
      if (!match || +match[1] < 1 || +match[1] > CHANNEL_COUNT || +match[2] < 1 || +match[2] > 4) return;
      const address = message.address.replace(/\/\?$/, '');
      if (!match[4] && Number.isFinite(message.args?.[0])) values.set(address, message.args[0]);
      const value = values.get(address) ?? (match[3] === 'pan' ? 0.5 : match[3] === 'on' ? 1 : -28 + ((+match[1] * 7 + +match[2] * 3) % 25));
      deliver({ address, args: [value] });
    },
  };
  setTimeout(() => {
    if (closed) return;
    socket.readyState = 1; socket.onopen?.();
    deliver({ config: { channels: channels.map(({ label, colour }, index) => ({ channel: index + 1, label, order: index + 1, ...(colour && { colour }) })),
      aux: ['Drums', 'Vocals', 'Guitar', 'Keys'].map((label, index) => ({ channel: index + 1, label, colour: '#48D8C4', stereo: true })), snapshot: 'Demo' } });
  }, 0);
  return socket;
}
