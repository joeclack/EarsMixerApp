import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useSession } from '../mixer/context';
export function useResetDeviceData(onReset?: () => void) {
  const { session } = useSession();
  const [resetting, setResetting] = useState(false);
  const reset = async () => {
    setResetting(true);
    try { await session.resetDeviceData(); onReset?.(); }
    catch { if (Platform.OS === 'web') window.alert('Could not reset device data. Try again.'); else Alert.alert('Reset failed', 'Could not reset device data. Try again.'); }
    finally { setResetting(false); }
  };
  const confirm = () => {
    if (resetting) return;
    const message = 'Clear this device’s nickname, layouts, hidden channels, settings, saved connections and caches? Desk levels and pan will not change.';
    if (Platform.OS === 'web') { if (window.confirm(message)) void reset(); }
    else Alert.alert('Reset device data?', message, [
      { text: 'Cancel', style: 'cancel' }, { text: 'Reset', style: 'destructive', onPress: () => void reset() },
    ]);
  };
  return { confirm, resetting };
}
