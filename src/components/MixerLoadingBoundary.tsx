import { useCallback, useSyncExternalStore, type PropsWithChildren } from 'react';
import { useSessionState } from '../mixer/context';
import FaderLoading from './FaderLoading';

// Draw the bank as soon as metadata is available. Reading desk values must not
// gate the artwork; each fader independently waits for fresh values before edits.
export default function MixerLoadingBoundary({ children }: PropsWithChildren) {
  const { session, state } = useSessionState();
  const snapshot = useCallback(() => {
    const mixer = session.mixer;
    const { config, status } = mixer.state;
    if (status === 'disconnected') return false;
    return !config;
  }, [session]);
  const waiting = useSyncExternalStore(session.mixer.subscribe, snapshot, snapshot);
  const probing = state.connecting && !session.mixer.state.config;
  return waiting || probing ? <FaderLoading /> : children;
}
