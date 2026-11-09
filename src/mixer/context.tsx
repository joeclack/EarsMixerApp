import React, { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MixerSession } from './session';
import type { Socket } from './client';

const Context = createContext<MixerSession | null>(null);
export function MixerProvider({ children }: React.PropsWithChildren) {
  const [session] = useState(() => new MixerSession(AsyncStorage, url => new WebSocket(url) as unknown as Socket));
  useEffect(() => {
    void session.hydrate();
    const subscription = AppState.addEventListener('change', state => session.setLifecycle(state));
    return () => { subscription.remove(); session.disconnect(false); };
  }, [session]);
  return <Context.Provider value={session}><LevelRestorePrompt />{children}</Context.Provider>;
}
function LevelRestorePrompt() {
  const { session, state } = useSessionState();
  const prompt = state.restorePrompt;
  useEffect(() => {
    if (!prompt) return;
    const title = 'Load saved levels for ' + prompt.saved.name + '?';
    const message = 'Desk levels differ from this phone’s saved state (' + new Date(prompt.saved.editedAt).toLocaleString() + ').';
    if (Platform.OS === 'web') {
      session.resolveLevelRestore(prompt, window.confirm(title + '\n\n' + message));
    } else Alert.alert(title, message, [
      { text: 'Keep desk levels', style: 'cancel', onPress: () => session.resolveLevelRestore(prompt, false) },
      { text: 'Load saved levels', onPress: () => session.resolveLevelRestore(prompt, true) },
    ], { cancelable: false });
  }, [session, prompt]);
  return null;
}
export function useSessionState() {
  const session = useContext(Context);
  if (!session) throw new Error('Missing mixer provider');
  const state = useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot);
  return { session, state };
}
export function useSession() {
  const { session, state } = useSessionState();
  // Pages and toolbars observe configuration/status, never the stream of channel values.
  const mix = useSyncExternalStore(session.mixer.subscribeControls, session.mixer.controlsSnapshot, session.mixer.controlsSnapshot);
  return { session, state, mix };
}

export function useAppearance() {
  const session = useContext(Context);
  if (!session) throw new Error('Missing mixer provider');
  return useSyncExternalStore(session.subscribe, () => session.state.settings.appearance, () => session.state.settings.appearance);
}
export function useFaderSession(channel: number) {
  const session = useContext(Context);
  if (!session) throw new Error('Missing mixer provider');
  const subscribe = useCallback((fn: () => void) => session.mixer.subscribeChannel(channel, fn), [session, channel]);
  const snapshot = useCallback(() => session.mixer.channelSnapshot(channel), [session, channel]);
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return { session, mix: session.mixer.state };
}

// Success notices are occasional UI events, independent of live channel values.
export function useConfirmationState() {
  const session = useContext(Context);
  if (!session) throw new Error('Missing mixer provider');
  const confirmation = useSyncExternalStore(session.subscribe, () => session.state.confirmation, () => session.state.confirmation);
  return { session, confirmation };
}
