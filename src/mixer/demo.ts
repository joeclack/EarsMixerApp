import type { Socket } from './client';
import { emptyPreferences } from './model';
export const DEMO_URL = 'http://demo.earsmixer.invalid/';
const names = ['Kick', 'Snare', 'Hi-hat', 'Tom 1', 'Tom 2', 'Overhead L', 'Overhead R', 'Bass', 'Guitar L', 'Guitar R', 'Keys L', 'Keys R', 'Tracks L', 'Tracks R', 'Lead vocal', 'Backing vocal 1', 'Backing vocal 2', 'Acoustic', 'Talkback', 'Audience'];
export const demoTemplates = [{ id: 'd'.repeat(64), name: 'Full band' }, { id: 'e'.repeat(64), name: 'Vocals' }];
export function demoTemplate(id: string) {
  if (!demoTemplates.some(template => template.id === id)) throw new Error('Template not found.');
  const vocals = id[0] === 'e';
  return { ...emptyPreferences(), selectedAux: vocals ? 2 : 1,
    channelOrder: vocals ? [15, 16, 17, ...names.map((_, index) => index + 1).filter(id => id < 15 || id > 17)] : names.map((_, index) => index + 1),
    hiddenByAux: vocals ? { '2': [19, 20] } : {},
    globalGroups: [{ id: 1, name: 'Drums', members: [1, 2, 3, 4, 5, 6, 7] }],
    groupsByAux: vocals ? { '2': [{ id: 2, name: 'Backing vocals', members: [16, 17] }] } : {} };
}
// Implements the same protocol locally. No WebSocket or HTTP connection exists.
export function createDemoSocket(): Socket {
  let closed = false;
  let meterTimer: ReturnType<typeof setInterval> | null = null;
  let requestId = 0;
  const values = new Map<string, number>();
  const deliver = (message: object) => queueMicrotask(() => { if (!closed) socket.onmessage?.({ data: JSON.stringify(message) }); });
  const socket: Socket = {
    readyState: 0, onopen: null, onclose: null, onerror: null, onmessage: null,
    close() { closed = true; socket.readyState = 3; if (meterTimer) clearInterval(meterTimer); meterTimer = null; },
    send(raw) {
      if (closed) return;
      const message = JSON.parse(raw);
      if (message.meters === true && !meterTimer) {
        meterTimer = setInterval(() => deliver({ meters: { kind: 'simulated', levels: names.map((_, index) => [index + 1, simulatedLevel(index + 1, Date.now())]) } }), 66);
        return;
      }
      // The demo engineer sees every request a few seconds after it is sent.
      if (message.request) {
        const id = ++requestId, at = Date.now();
        deliver({ requestSent: { id, kind: message.request.kind ?? null, text: String(message.request.text || ''), at } });
        setTimeout(() => deliver({ requestAcknowledged: { id } }), 3000);
        return;
      }
      const match = /^\/Input_Channels\/(\d+)\/Aux_Send\/(\d+)\/send_(level|pan|on)(\/\?)?$/.exec(message.address || '');
      if (!match || +match[1] < 1 || +match[1] > 20 || +match[2] < 1 || +match[2] > 4) return;
      const address = message.address.replace(/\/\?$/, '');
      if (!match[4] && Number.isFinite(message.args?.[0])) values.set(address, message.args[0]);
      const value = values.get(address) ?? (match[3] === 'pan' ? 0.5 : match[3] === 'on' ? 1 : -28 + ((+match[1] * 7 + +match[2] * 3) % 25));
      deliver({ address, args: [value] });
    },
  };
  setTimeout(() => {
    if (closed) return;
    socket.readyState = 1; socket.onopen?.();
    deliver({ config: { channels: names.map((label, index) => ({ channel: index + 1, label, order: index + 1 })),
      aux: ['Drums', 'Vocals', 'Guitar', 'Keys'].map((label, index) => ({ channel: index + 1, label, colour: '#48D8C4', stereo: true })), snapshot: 'Demo', meters: 'simulated' } });
  }, 0);
  return socket;
}

// Simulated signal for the demo's meters: drums on a 120 bpm grid and gently
// moving sustained sources. Always reported as simulated, never as a desk's.
function simulatedLevel(channel: number, time: number): number | null {
  const beat = (time / 500) % 4, sinceBeat = (beat % 1) * 500, wobble = Math.sin(time / 37 + channel * 1.7) * 1.5;
  if (channel === 1) return Math.round((-6 - sinceBeat / 18 + wobble) * 10) / 10;
  if (channel === 2) return Math.floor(beat) % 2 === 1 ? Math.round((-8 - sinceBeat / 16 + wobble) * 10) / 10 : null;
  if (channel === 3) return Math.round((-22 - ((time / 250) % 1) * 18 + wobble) * 10) / 10;
  if (channel >= 19) return null;
  const db = -24 + ((channel * 7) % 10) + Math.sin(time / 900 + channel) * 5 + wobble;
  return Math.max(-60, Math.round(db * 10) / 10);
}
