import { Alert, Platform } from 'react-native';
import { useSession } from '../mixer/context';
export function useSetAllLevelsOff() {
  const { session, state, mix } = useSession();
  return () => {
    const server = state.server, aux = mix.aux;
    const name = mix.config?.aux.find(item => item.channel === aux)?.label || 'this AUX';
    const apply = () => {
      if (session.state.server === server && session.mixer.setAllLevelsOff(aux)) return;
      if (Platform.OS === 'web') window.alert('The mixer connection changed. Try again.');
      else Alert.alert('Could not set levels to off', 'The mixer connection changed. Try again.');
    };
    const message = `Set every channel send in ${name} to −∞ dB (off), including hidden channels? Pan stays unchanged.`;
    if (Platform.OS === 'web') { if (window.confirm(message)) apply(); }
    else Alert.alert('Set all levels to off?', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Set to off', style: 'destructive', onPress: apply }]);
  };
}
