import { createContext, useCallback, useContext, useSyncExternalStore, type PropsWithChildren } from 'react';
import { mixerLabel, normalizeMixerAddress } from '../connection';
import { useSession, useSessionState } from '../mixer/context';
import { DEMO_URL } from '../mixer/demo';
import LoadingTransition from './LoadingTransition';

// True while the app's startup loader covers the screen. The mixer then skips
// its own loader so the animation plays once rather than restarting beneath it.
export const StartupCover = createContext(false);

// Whether the mixer is waiting for its first channel metadata.
export function useMixerLoading() {
  const { session, state } = useSessionState();
  const snapshot = useCallback(() => {
    const { config, status } = session.mixer.state;
    return status !== 'disconnected' && !config;
  }, [session]);
  const waiting = useSyncExternalStore(session.mixer.subscribe, snapshot, snapshot);
  return waiting || (state.connecting && !session.mixer.state.config);
}

// What the mixer is waiting for, in words, shown under the loading faders.
function useMixerLoadingLabel() {
  const { session, state, mix } = useSession();
  const target = state.connectingTo || state.server;
  if (target === DEMO_URL || state.demo) return 'Starting demo…';
  if (!state.connecting && mix.status === 'loading') return 'Loading channels…';
  if (!target) return 'Connecting…';
  let name = target;
  try { name = mixerLabel(normalizeMixerAddress(target), session.state.recent); } catch {}
  return 'Connecting to ' + name + '…';
}

// Draw the bank as soon as metadata is available. Reading desk values must not
// gate the artwork; each fader independently waits for fresh values before edits.
export default function MixerLoadingBoundary({ children }: PropsWithChildren) {
  const loading = useMixerLoading();
  const covered = useContext(StartupCover);
  const label = useMixerLoadingLabel();
  // The mixer page sits on the desk colour, so its loader does too.
  return <LoadingTransition loading={loading && !covered} desk label={label}>{children}</LoadingTransition>;
}
