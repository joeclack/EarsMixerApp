import { Alert, Platform } from 'react-native';
import { useSession } from '../mixer/context';

// Forget the levels this phone saved for each mixer and AUX. Desk levels stay
// as they are; only the "Load saved levels?" offer goes away.
export function useClearSavedLevels() {
  const { session } = useSession();
  return () => {
    const message = 'This phone will forget the levels it saved for every mixer and AUX. The desk’s levels do not change.';
    const clear = () => { session.clearSavedLevels(); session.notifySuccess('Saved levels cleared'); };
    if (Platform.OS === 'web') { if (window.confirm(message)) clear(); return; }
    Alert.alert('Clear saved levels?', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear', style: 'destructive', onPress: clear }]);
  };
}
