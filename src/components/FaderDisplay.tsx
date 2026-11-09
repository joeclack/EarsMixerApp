import { memo } from 'react';
import { Platform, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFaderSession } from '../mixer/context';
import { levelText } from '../mixer/model';
import { Icon } from './ui';

// Each LCD subscribes only to its own channel, independently of the strip bank.
export default memo(function FaderDisplay({ channel, label, expandable = false, large = false, fitContent = false }: { channel: number; label: string; expandable?: boolean; large?: boolean; fitContent?: boolean }) {
  const { session, mix } = useFaderSession(channel);
  const value = levelText(session.mixer.displayValue(channel), mix.parameter);
  return <View style={{ width: '100%', height: fitContent ? undefined : large ? 96 : 64, borderRadius: 8, padding: 4, backgroundColor: '#071921', borderWidth: 1, borderColor: '#497886' }}>
    <LinearGradient pointerEvents="none" colors={['#24566A', '#071B29']} style={{ position: 'absolute', inset: 1, borderRadius: 7 }} />
    <View style={{ flex: fitContent ? undefined : 1, borderRadius: 3, paddingHorizontal: 3, paddingVertical: fitContent ? 6 : 3, flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: '#81E9E5', borderWidth: 1, borderColor: '#ADFFEF',
      boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 7, spreadDistance: 0, color: '#2DE8F133' }] }}>
      <View style={{ flex: 1, minWidth: 0, height: fitContent ? undefined : '100%', justifyContent: fitContent ? 'flex-start' : 'space-between', gap: fitContent ? 4 : 0, alignItems: 'center' }}>
        <Text numberOfLines={2} accessibilityLabel={label} style={{ color: '#07343D', textAlign: 'center', fontSize: large ? 17 : 11, lineHeight: large ? 21 : 13, fontWeight: '700', width: '100%' }}>{label}</Text>
        <Text style={{ color: '#07343D', textAlign: 'center', fontSize: large ? 22 : 12, lineHeight: large ? 28 : 15, fontWeight: '700', fontVariant: ['tabular-nums'],
          fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{value}</Text>
      </View>
      {expandable && <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={12} color="#07343D" />
      </View>}
    </View>
  </View>;
});
