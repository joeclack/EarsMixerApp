// @refresh reset
// Session/client class instances cannot be reused across Fast Refresh revisions.
// Remount the provider so its existing effect closes old sockets and queued writes.
import React, { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MixerSession } from './session';
import type { Socket } from './client';
import { mixInUseText } from './mixInUse';

const Context = createContext<MixerSession | null>(null);
export function MixerProvider({ children }: React.PropsWithChildren) {
  const [session] = useState(() => {
    const created = new MixerSession(AsyncStorage, url => new WebSocket(url) as unknown as Socket);
    created.mixer.setClientType(Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'app-web');
    return created;
  });
  useEffect(() => {
    void session.hydrate();
    const subscription = AppState.addEventListener('change', state => session.setLifecycle(state));
    return () => { subscription.remove(); session.disconnect(false); };
  }, [session]);
  return <Context.Provider value={session}><LevelRestorePrompt /><MixInUsePrompt />{children}</Context.Provider>;
}
// Arriving on a mix someone else is on, or changed in the last couple of hours,
// says so once, so a musician knows their changes will be heard by someone else.
function MixInUsePrompt() {
  const session = useContext(Context)!;
  useEffect(() => session.mixer.onMixInUse(warning => {
    const name = session.mixer.state.config?.aux.find(aux => aux.channel === warning.aux)?.label || 'this mix';
    const { title, message } = mixInUseText(warning, name);
    if (Platform.OS === 'web') window.alert(title + '\n\n' + message);
    else Alert.alert(title, message, [{ text: 'OK' }]);
  }), [session]);
  return null;
}
function LevelRestorePrompt() {
  const { session, state } = useSessionState();
  const prompt = state.restorePrompt;
  useEffect(() => {
    if (!prompt) return;
    // A plain yes or no: the mix changed on the desk, so load this phone's saved levels or leave the desk as it is.
    const title = 'Mix changed on the desk';
    const message = prompt.saved.name + ' has changed on the desk since you last mixed it on this phone. Load your saved levels from this phone, or keep the mix how it is?';
    if (Platform.OS === 'web') {
      session.resolveLevelRestore(prompt, window.confirm(title + '\n\n' + message));
    } else Alert.alert(title, message, [
      { text: 'No, keep how it is', style: 'cancel', onPress: () => session.resolveLevelRestore(prompt, false) },
      { text: 'Yes, load my levels', onPress: () => session.resolveLevelRestore(prompt, true) },
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
