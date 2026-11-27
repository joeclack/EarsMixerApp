import { useEffect, useRef } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import * as Updates from 'expo-updates';

// Checking again sooner than this when the app comes back adds nothing.
const RECHECK_MS = 5 * 60 * 1000;

const enabled = Platform.OS !== 'web' && !__DEV__ && Updates.isEnabled;

// Looks for a newer over-the-air update on launch and whenever the app comes
// back to the foreground, downloads it, then asks once per update to restart.
// Someone who keeps the app open for days still gets fixes without a store
// release. "Later" leaves the update to apply on the next launch.
export function useUpdatePrompt() {
  const { isUpdatePending, downloadedUpdate } = Updates.useUpdates();
  const lastCheck = useRef(0);
  const busy = useRef(false);
  const prompted = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const check = async () => {
      if (busy.current || Date.now() - lastCheck.current < RECHECK_MS) return;
      busy.current = true; lastCheck.current = Date.now();
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // Offline or on the mixer's own Wi-Fi: try again next time.
      } finally { busy.current = false; }
    };
    void check();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    return () => subscription.remove();
  }, []);

  // Pending covers updates downloaded by the check above and by the automatic
  // check expo-updates makes at launch.
  const updateId = isUpdatePending ? downloadedUpdate?.updateId ?? 'pending' : null;
  useEffect(() => {
    if (!enabled || !updateId || prompted.current === updateId) return;
    prompted.current = updateId;
    Alert.alert('Update ready', 'A new version of EarsMixer has downloaded. Close and reopen the app to use it.', [
      { text: 'Later', style: 'cancel' },
      { text: 'Restart now', onPress: () => { void Updates.reloadAsync().catch(() => {}); } },
    ]);
  }, [updateId]);
}
