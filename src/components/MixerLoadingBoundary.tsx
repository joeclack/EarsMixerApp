import { useCallback, useSyncExternalStore, type PropsWithChildren } from 'react';
import { useSessionState } from '../mixer/context';
import IconLoading from './IconLoading';

// Observe only whether there is anything to display. Incoming desk packets must
// not re-render the channel list once the first live or cached value is present.
export default function MixerLoadingBoundary({ children }: PropsWithChildren) {
  const { session, state } = useSessionState();
  const snapshot = useCallback(() => {
    const mixer = session.mixer;
    const { config, aux, status } = mixer.state;
    if (status === 'disconnected') return false;
    if (!config) return true;
    if (!aux || !config.channels.length) return false;
    return !config.channels.some(channel => mixer.displayValue(channel.channel) !== undefined);
  }, [session]);
  const waiting = useSyncExternalStore(session.mixer.subscribe, snapshot, snapshot);
  const probing = state.connecting && !session.mixer.state.config;
  return waiting || probing ? <IconLoading /> : children;
}
