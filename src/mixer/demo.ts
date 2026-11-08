import type { Socket } from './client';
import { emptyPreferences } from './model';
export const DEMO_URL = 'http://demo.earsmixer.invalid/';
const names = ['Kick', 'Snare', 'Hi-hat', 'Tom 1', 'Tom 2', 'Overhead L', 'Overhead R', 'Bass', 'Guitar L', 'Guitar R', 'Keys L', 'Keys R', 'Tracks L', 'Tracks R', 'Lead vocal', 'Backing vocal 1', 'Backing vocal 2', 'Acoustic', 'Talkback', 'Audience'];
export const demoTemplates = [{ id: 'd'.repeat(64), name: 'Full band' }, { id: 'e'.repeat(64), name: 'Vocals' }];
export function demoTemplate(id: string) {
  if (!demoTemplates.some(template => template.id === id)) throw new Error('Template not found.');
  return { ...emptyPreferences(), selectedAux: id[0] === 'e' ? 2 : 1, channelOrder: id[0] === 'e' ? [15, 16, 17, ...names.map((_, index) => index + 1).filter(id => id < 15 || id > 17)] : names.map((_, index) => index + 1) };
}
// Implements the same protocol locally. No WebSocket or HTTP connection exists.
export function createDemoSocket(): Socket {
  let closed = false;
  const values = new Map<string, number>();
  const deliver = (message: object) => queueMicrotask(() => { if (!closed) socket.onmessage?.({ data: JSON.stringify(message) }); });
  const socket: Socket = {
    readyState: 0, onopen: null, onclose: null, onerror: null, onmessage: null,
    close() { closed = true; socket.readyState = 3; },
    send(raw) {
      if (closed) return;
      const message = JSON.parse(raw);
      const match = /^\/Input_Channels\/(\d+)\/Aux_Send\/(\d+)\/send_(level|pan)(\/\?)?$/.exec(message.address || '');
      if (!match || +match[1] < 1 || +match[1] > 20 || +match[2] < 1 || +match[2] > 4) return;
      const address = message.address.replace(/\/\?$/, '');
      if (!match[4] && Number.isFinite(message.args?.[0])) values.set(address, message.args[0]);
      const value = values.get(address) ?? (match[3] === 'pan' ? 0.5 : -28 + ((+match[1] * 7 + +match[2] * 3) % 25));
      deliver({ address, args: [value] });
    },
  };
  setTimeout(() => {
    if (closed) return;
    socket.readyState = 1; socket.onopen?.();
    deliver({ config: { channels: names.map((label, index) => ({ channel: index + 1, label, order: index + 1 })),
      aux: ['Drums', 'Vocals', 'Guitar', 'Keys'].map((label, index) => ({ channel: index + 1, label, colour: '#48D8C4', stereo: true })), snapshot: 'Demo' } });
  }, 0);
  return socket;
}
