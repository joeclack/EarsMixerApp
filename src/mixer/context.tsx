import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
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
  return <Context.Provider value={session}>{children}</Context.Provider>;
}
export function useSession() {
  const session = useContext(Context);
  if (!session) throw new Error('Missing mixer provider');
  const state = useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot);
  const mix = useSyncExternalStore(session.mixer.subscribe, () => session.mixer.state, () => session.mixer.state);
  return { session, state, mix };
}
