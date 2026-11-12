import { createContext, useCallback, useContext, useSyncExternalStore, type PropsWithChildren } from 'react';
import { useSessionState } from '../mixer/context';
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

// Draw the bank as soon as metadata is available. Reading desk values must not
// gate the artwork; each fader independently waits for fresh values before edits.
export default function MixerLoadingBoundary({ children }: PropsWithChildren) {
  const loading = useMixerLoading();
  const covered = useContext(StartupCover);
  return <LoadingTransition loading={loading && !covered}>{children}</LoadingTransition>;
}
