import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';

const colours = ['#116B65', '#5253A2', '#24619C', '#855329'];
export default function AuxPresence() {
  const { mix } = useSession(), theme = useTheme(), insets = useSafeAreaInsets();
  if (mix.status !== 'connected' || !mix.peers.length) return null;
  const names = mix.peers.map(peer => peer.nickname || 'Unnamed device');
  const aux = mix.config?.aux.find(item => item.channel === mix.aux)?.label || 'this AUX';
  const showNames = () => {
    const title = 'Also on ' + aux, message = names.join('\n');
    if (Platform.OS === 'web') window.alert(title + '\n\n' + message);
    else Alert.alert(title, message, [{ text: 'Close', style: 'cancel' }]);
  };
  return <Pressable accessibilityRole="button" accessibilityLabel={'Also on ' + aux + ': ' + names.join(', ')}
    accessibilityHint="Show connected users" onPress={showNames}
    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, minHeight: 44,
      paddingLeft: insets.left + 20, paddingRight: insets.right + 20, paddingVertical: 6 }}>
    <Text numberOfLines={1} style={{ color: theme.muted, fontSize: 13, flexShrink: 1 }}>{names.join(', ')}</Text>
    <View style={{ flexDirection: 'row', paddingLeft: 6 }}>
      {mix.peers.slice(0, 4).map(peer => {
        const initials = peer.nickname?.split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase() || '?';
        return <View key={peer.id} style={{ width: 30, height: 30, marginLeft: -6, borderRadius: 15, borderWidth: 2,
          borderColor: theme.bg, backgroundColor: colours[Number(peer.id) % colours.length], alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 11 }}>{initials}</Text>
        </View>;
      })}
      {mix.peers.length > 4 && <View style={{ width: 30, height: 30, marginLeft: -6, borderRadius: 15, borderWidth: 2,
        borderColor: theme.bg, backgroundColor: theme.panel, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.text, fontSize: 10 }}>+{mix.peers.length - 4}</Text>
      </View>}
    </View>
  </Pressable>;
}
