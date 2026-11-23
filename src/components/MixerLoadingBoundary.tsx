import { useCallback, useSyncExternalStore, type PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { mixerLabel, normalizeMixerAddress } from '../connection';
import { useSession, useSessionState } from '../mixer/context';
import { DEMO_URL } from '../mixer/demo';
import { useTheme } from '../theme';

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

// What the mixer is waiting for, in words.
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
// Until then, a single line says what the mixer is waiting for.
export default function MixerLoadingBoundary({ children }: PropsWithChildren) {
  const loading = useMixerLoading();
  const label = useMixerLoadingLabel();
  const theme = useTheme();
  if (!loading) return <>{children}</>;
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityState={{ busy: true }}
    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <Text numberOfLines={2} style={{ maxWidth: 280, color: theme.muted, fontSize: 15, lineHeight: 20, textAlign: 'center' }}>{label}</Text>
  </View>;
}
