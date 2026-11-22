import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { hardwarePalette } from './hardwarePalette';
import { Engraved } from './ConsoleDetails';
import { Icon } from './ui';

// A small static preview of the real interface for the portrait or landscape
// setup step, hidden from assistive technologies. Other steps have none.
export default memo(function SetupPreview({ step }: { step: number }) {
  const preview = step === 2 ? <Views /> : null;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
    <View style={{ width: '100%', maxWidth: 340 }}>{preview}</View>
  </View>;
});

function MiniStrip({ level }: { level: number }) {
  const { dark } = useTheme(), palette = hardwarePalette(dark);
  return <View style={{ width: 12, flex: 1, borderRadius: 6, backgroundColor: dark ? '#0B171C' : '#E9E2CC',
    borderWidth: dark ? 0 : 1, borderColor: '#B42B43', alignItems: 'center' }}>
    <View style={{ position: 'absolute', top: 6, bottom: 6, width: 2, borderRadius: 1, backgroundColor: '#000000' }} />
    <View style={{ position: 'absolute', bottom: 6, height: `${level * 70}%`, width: 2, borderRadius: 1, backgroundColor: palette.indicator }} />
    <View style={{ position: 'absolute', bottom: `${level * 70}%`, width: 11, height: 7, borderRadius: 2, backgroundColor: '#1F292E',
      borderWidth: 1, borderColor: '#5A6970' }} />
  </View>;
}

function MiniBar({ level }: { level: number }) {
  const { dark } = useTheme(), palette = hardwarePalette(dark);
  return <View style={{ height: 10, borderRadius: 5, backgroundColor: dark ? '#0B171C' : '#E9E2CC', justifyContent: 'center',
    borderWidth: dark ? 0 : 1, borderColor: '#B42B43' }}>
    <View style={{ marginHorizontal: 5, height: 2, borderRadius: 1, backgroundColor: '#000000' }} />
    <View style={{ position: 'absolute', left: 5, width: `${level * 80}%`, height: 2, borderRadius: 1, backgroundColor: palette.indicator }} />
    <View style={{ position: 'absolute', left: `${level * 80}%`, width: 7, height: 10, borderRadius: 2, backgroundColor: '#1F292E',
      borderWidth: 1, borderColor: '#5A6970' }} />
  </View>;
}

function Phone({ width, height, label, children }: { width: number; height: number; label: string; children: ReactNode }) {
  const theme = useTheme();
  return <View style={{ alignItems: 'center', gap: 8 }}>
    <View style={{ width, height, borderRadius: 20, padding: 5, backgroundColor: theme.dark ? '#2B3740' : '#1E272C',
      boxShadow: [{ offsetX: 0, offsetY: 6, blurRadius: 14, color: theme.dark ? '#000000A6' : '#2E4A5840' }] }}>
      <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.bg, padding: 9 }}>{children}</View>
    </View>
    <Engraved size={10}>{label}</Engraved>
  </View>;
}

// The same mix held upright and turned sideways.
function Views() {
  const theme = useTheme();
  const levels = [0.7, 0.5, 0.85, 0.6, 0.4, 0.75];
  return <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 22 }}>
    <Phone width={86} height={164} label="Portrait">
      <View style={{ flex: 1, gap: 9, paddingTop: 6 }}>
        {levels.map((level, index) => <MiniBar key={index} level={level} />)}
      </View>
    </Phone>
    <Phone width={196} height={106} label="Landscape">
      <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
        <View style={{ gap: 6, justifyContent: 'center' }}>
          {(['headphones', 'slider.horizontal.3'] as const).map((symbol, index) => <View key={symbol} style={{ width: 20, height: 20, borderRadius: 10,
            alignItems: 'center', justifyContent: 'center', backgroundColor: theme.secondary }}>
            <Icon name={{ ios: symbol, android: index === 0 ? 'headphones' : 'tune', web: index === 0 ? 'headphones' : 'tune' }} size={10} color={theme.text} />
          </View>)}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
          {levels.map((level, index) => <MiniStrip key={index} level={level} />)}
        </View>
      </View>
    </Phone>
  </View>;
}
