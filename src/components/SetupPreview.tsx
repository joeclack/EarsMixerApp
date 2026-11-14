import { memo, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme';
import HardwarePanel from './HardwarePanel';
import { hardwarePalette } from './hardwarePalette';
import { Engraved } from './ConsoleDetails';
import { Icon } from './ui';

// Small static previews of the real interface for each setup step, hidden
// from assistive technologies.
export default memo(function SetupPreview({ step, nickname }: { step: number; nickname: string }) {
  const preview = [<Presence key={0} nickname={nickname} />, <Connect key={1} />, <Views key={2} />, <Templates key={3} />][step];
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
    <View style={{ width: '100%', maxWidth: 340 }}>{preview}</View>
  </View>;
});

function Card({ children }: { children: ReactNode }) {
  return <HardwarePanel radius={22} style={{ padding: 16, gap: 12 }}>{children}</HardwarePanel>;
}

function Chip({ label, you = false }: { label: string; you?: boolean }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15,
    backgroundColor: you ? theme.tint : theme.secondary }}>
    <Icon name={{ ios: 'person.fill', android: 'person', web: 'person' }} size={12} color={you ? '#FFFFFF' : theme.muted} />
    <Text numberOfLines={1} style={{ maxWidth: 120, fontSize: 14, fontWeight: '600', color: you ? '#FFFFFF' : theme.text }}>{label}</Text>
  </View>;
}

// How your nickname appears to others on the same mix.
function Presence({ nickname }: { nickname: string }) {
  const theme = useTheme();
  return <Card>
    <View style={{ gap: 2 }}>
      <Engraved size={9}>Monitor mix</Engraved>
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>Drums IEM</Text>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Chip label={nickname.trim() || 'You'} you /><Chip label="Sam" /><Chip label="Alex" />
    </View>
  </Card>;
}

function MixerRow({ name, host, last = false }: { name: string; host: string; last?: boolean }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.line }}>
    <View style={{ flex: 1 }}>
      <Text style={{ color: theme.text, fontSize: 16 }}>{name}</Text>
      <Text style={{ color: theme.muted, fontSize: 12, marginTop: 2 }}>{host}</Text>
    </View>
    <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={12} color={theme.muted} />
  </View>;
}

function Connect() {
  return <Card>
    <Engraved>Nearby mixers</Engraved>
    <View><MixerRow name="FOH Rack" host="192.168.1.100:8082" /><MixerRow name="Monitor World" host="192.168.1.120:8082" last /></View>
  </Card>;
}

// Saved layouts fanned out like a stack of cards.
function Templates() {
  const theme = useTheme();
  const names = ['Vocals', 'Keys', 'Drums IEM'];
  return <View style={{ height: 170 }}>
    {names.map((name, index) => <HardwarePanel key={name} radius={18} style={{ position: 'absolute', left: 24 - index * 12, right: index * 12, top: index * 34,
      height: 96, padding: 16, transform: [{ rotate: (index - 2) * 2.5 + 'deg' }] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name={{ ios: 'square.stack', android: 'layers', web: 'layers' }} size={18} />
        <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '600' }}>{name}</Text>
        {index === names.length - 1 && <Icon name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} size={18} />}
      </View>
      <Text style={{ color: theme.muted, fontSize: 12, marginTop: 6 }}>{14 - index * 3} channels · 2 groups</Text>
    </HardwarePanel>)}
  </View>;
}

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
