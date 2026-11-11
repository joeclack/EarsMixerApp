import { memo, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { useSession } from '../mixer/context';
import { DragHaptics } from '../mixer/dragHaptics';
import { dbToPosition, levelText, positionToDb } from '../mixer/model';
import { useTheme } from '../theme';
import { faderArtwork } from './faderArtwork';
import { FADER_CAP_HEIGHT, FADER_CAP_WIDTH } from './faderGeometry';
import FaderHousing from './FaderHousing';
import HardwarePanel from './HardwarePanel';
import { hardwarePalette } from './hardwarePalette';
import { Engraved, LcdReadout, Led } from './ConsoleDetails';
import { Icon } from './ui';

// Small previews of the real interface for each setup step. Most are static
// illustrations hidden from assistive technologies; the Adjust step's faders
// are practice faders the user can drag, which never send anything to a desk.
export default memo(function SetupPreview({ step, nickname }: { step: number; nickname: string }) {
  const preview = [<Presence key={0} nickname={nickname} />, <Connect key={1} />, <Templates key={2} />,
    <Adjust key={3} />, <Landscape key={4} />, <Layout key={5} />][step];
  const interactive = step === 3;
  return <View pointerEvents={interactive ? 'box-none' : 'none'} accessible={false} accessibilityElementsHidden={!interactive}
    importantForAccessibility={interactive ? 'auto' : 'no-hide-descendants'}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Led size={6} /><Engraved size={9}>Monitor mix</Engraved></View>
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>Drums IEM</Text>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Chip label={nickname.trim() || 'You'} you /><Chip label="Sam" /><Chip label="Alex" />
    </View>
  </Card>;
}

function MixerRow({ name, host, on = true, last = false }: { name: string; host: string; on?: boolean; last?: boolean }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.line }}>
    <Led on={on} />
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

// A practice fader with the real housing, handle artwork, readout and drag
// haptics. Its level is local to setup and never reaches the mixer.
function PracticeFader({ label, initialDb }: { label: string; initialDb: number }) {
  const theme = useTheme(), { session } = useSession();
  const [track, setTrack] = useState(0);
  const [db, setDb] = useState(initialDb);
  const position = useSharedValue(dbToPosition(initialDb));
  const start = useSharedValue(0);
  const haptics = useRef(new DragHaptics(() => { if (session.state.settings.haptics) void Haptics.selectionAsync().catch(() => {}); })).current;
  const begin = useCallback((value: number) => haptics.begin(value), [haptics]);
  const report = useCallback((value: number) => { haptics.move(value); setDb(positionToDb(value)); }, [haptics]);
  const end = useCallback(() => haptics.end(true), [haptics]);
  const set = useCallback((value: number) => { position.set(value); setDb(positionToDb(value)); }, [position]);
  const pan = useMemo(() => Gesture.Pan().enabled(track > 0).activeOffsetX([-3, 3]).failOffsetY([-10, 10]).onStart(() => {
    'worklet';
    start.set(position.get()); scheduleOnRN(begin, position.get());
  }).onUpdate(event => {
    'worklet';
    const next = Math.max(0, Math.min(1, start.get() + event.translationX / track));
    position.set(next); scheduleOnRN(report, next);
  }).onFinalize(() => { 'worklet'; scheduleOnRN(end); }), [track, position, start, begin, report, end]);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: track * position.get() }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: track * position.get() }));
  const text = levelText(db, 'level');
  return <View style={{ gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 }}>
      <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
      <LcdReadout>{text}</LcdReadout>
    </View>
    <FaderHousing vertical={false}>
      <GestureDetector gesture={pan}>
        <View accessible accessibilityRole="adjustable" accessibilityLabel={label + ' practice fader'} accessibilityValue={{ text }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={event => set(Math.max(0, Math.min(1, position.get() + (event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05))))}
          style={{ height: 56, justifyContent: 'center' }}>
          <View onLayout={event => setTrack(event.nativeEvent.layout.width)} style={{ marginHorizontal: FADER_CAP_HEIGHT / 2, height: 6, justifyContent: 'center' }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: '#000000' }} />
            <Animated.View style={[{ position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: theme.dark ? '#48D8C4' : '#7EEBD0' }, fillStyle]} />
            <Animated.View style={[{ position: 'absolute', left: -FADER_CAP_HEIGHT / 2, top: 3 - FADER_CAP_WIDTH / 2, width: FADER_CAP_HEIGHT, height: FADER_CAP_WIDTH,
              alignItems: 'center', justifyContent: 'center', boxShadow: [{ offsetX: 1, offsetY: 4, blurRadius: 4, color: '#000000B3' }], borderRadius: 8 }, thumbStyle]}>
              <Image source={faderArtwork} resizeMode="stretch" style={{ width: FADER_CAP_WIDTH, height: FADER_CAP_HEIGHT, transform: [{ rotate: '90deg' }] }} />
            </Animated.View>
          </View>
        </View>
      </GestureDetector>
    </FaderHousing>
  </View>;
}

function Adjust() {
  return <View style={{ gap: 14 }}>
    <PracticeFader label="Keys" initialDb={-6} />
    <PracticeFader label="Click" initialDb={2.4} />
    <View style={{ alignItems: 'center' }}><Engraved size={10}>Try it: drag a handle</Engraved></View>
  </View>;
}

function MiniStrip({ level }: { level: number }) {
  const { dark } = useTheme(), palette = hardwarePalette(dark);
  return <View style={{ width: 16, flex: 1, borderRadius: 8, backgroundColor: dark ? '#0B171C' : '#E9E2CC',
    borderWidth: dark ? 0 : 1, borderColor: '#B42B43', alignItems: 'center',
    boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: dark ? '#000000A6' : '#2E4A5833' }] }}>
    <View style={{ position: 'absolute', top: 8, bottom: 8, width: 2, borderRadius: 1, backgroundColor: '#000000' }} />
    <View style={{ position: 'absolute', bottom: 8, height: `${level * 70}%`, width: 2, borderRadius: 1, backgroundColor: palette.indicator }} />
    <View style={{ position: 'absolute', bottom: `${level * 70}%`, width: 14, height: 9, borderRadius: 2, backgroundColor: '#1F292E',
      borderWidth: 1, borderColor: '#5A6970' }} />
  </View>;
}

// A phone turned sideways, showing the vertical fader bank and the side rail.
function Landscape() {
  const theme = useTheme();
  const levels = [0.7, 0.5, 0.85, 0.6, 0.4, 0.75, 0.55];
  return <View style={{ alignItems: 'center', gap: 10 }}>
    <View style={{ width: 300, height: 150, borderRadius: 28, padding: 7, backgroundColor: theme.dark ? '#2B3740' : '#1E272C',
      boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 18, color: theme.dark ? '#000000A6' : '#2E4A5840' }] }}>
      <View style={{ flex: 1, borderRadius: 22, overflow: 'hidden', backgroundColor: theme.bg, flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, gap: 10 }}>
        <View style={{ gap: 8, justifyContent: 'center' }}>
          {(['headphones', 'slider.horizontal.3', 'infinity'] as const).map((symbol, index) => <View key={symbol} style={{ width: 24, height: 24, borderRadius: 12,
            alignItems: 'center', justifyContent: 'center', backgroundColor: index === 2 ? theme.danger : theme.secondary }}>
            <Icon name={{ ios: symbol, android: index === 0 ? 'headphones' : index === 1 ? 'tune' : 'all_inclusive', web: index === 0 ? 'headphones' : index === 1 ? 'tune' : 'all_inclusive' }}
              size={12} color={index === 2 ? '#FFFFFF' : theme.text} />
          </View>)}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
          {levels.map((level, index) => <MiniStrip key={index} level={level} />)}
        </View>
      </View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={{ ios: 'rotate.right', android: 'screen_rotation', web: 'screen_rotation' }} size={14} color={theme.muted} />
      <Engraved size={10}>Turn sideways</Engraved>
    </View>
  </View>;
}

function LayoutRow({ name, hidden = false, last = false }: { name: string; hidden?: boolean; last?: boolean }) {
  const theme = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, opacity: hidden ? 0.45 : 1,
    borderBottomWidth: last ? 0 : 1, borderBottomColor: theme.line }}>
    <Icon name={hidden ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' } : { ios: 'eye', android: 'visibility', web: 'visibility' }} size={16} />
    <Text style={{ flex: 1, color: theme.text, fontSize: 16 }}>{name}</Text>
    <Icon name={{ ios: 'line.3.horizontal', android: 'drag_handle', web: 'drag_handle' }} size={16} color={theme.muted} />
  </View>;
}

function Layout() {
  return <Card>
    <View><LayoutRow name="Click" /><LayoutRow name="Keys" /><LayoutRow name="Crowd mics" hidden /><LayoutRow name="Vox 1" last /></View>
  </Card>;
}
