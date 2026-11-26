import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useSession } from '../mixer/context';

export const RESET_DEVICE_DATA_SUMMARY = 'Clears your nickname, preferences, saved mixer connections, channel layouts and saved levels on this device. You’ll go through setup again.';

const RESET_DEVICE_DATA_DETAILS = [
  'The app disconnects from the mixer and clears its data on this device.',
  '',
  '• Your nickname and app preferences',
  '• Recent mixers and saved pairing access',
  '• Your selected monitor mix, channel order, hidden channels, groups and template selection',
  '• Saved levels and cached mixer data',
  '',
  'You’ll go through setup again. Desk levels and pan will not change.',
].join('\n');

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
    if (Platform.OS === 'web') { if (window.confirm(RESET_DEVICE_DATA_DETAILS)) void reset(); }
    else Alert.alert('Reset device data?', RESET_DEVICE_DATA_DETAILS, [
      { text: 'Cancel', style: 'cancel' }, { text: 'Reset', style: 'destructive', onPress: () => void reset() },
    ]);
  };
  return { confirm, resetting };
}
