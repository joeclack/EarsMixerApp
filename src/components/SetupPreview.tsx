import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Image, Modal, Platform, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AppBackground from './AppBackground';
import CloseButton from './CloseButton';
import { HOLD_DELAY, HOLD_LIFT, HOLD_SCALE } from './Fader';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSession } from '../mixer/context';
import { useDetentHaptics } from '../mixer/dragHaptics';
import { dbToPosition, levelText, positionToDb } from '../mixer/model';
import { useTheme } from '../theme';
import { faderArtwork } from './faderArtwork';
import { FADER_CAP_HEIGHT, FADER_CAP_WIDTH } from './faderGeometry';
import FaderHousing from './FaderHousing';
import HardwarePanel from './HardwarePanel';
import { hardwarePalette } from './hardwarePalette';
import { Engraved, LcdReadout } from './ConsoleDetails';
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

// One practice channel's level, shared by its bar and its tall fader. It is
// local to setup and never reaches the mixer.
type PracticeChannel = { label: string; position: SharedValue<number>; db: number; setDb(db: number): void };
function usePracticeChannel(label: string, initialDb: number): PracticeChannel {
  const position = useSharedValue(dbToPosition(initialDb));
  const [db, setDb] = useState(initialDb);
  return { label, position, db, setDb };
}

// The drag shared by both orientations: the real handle artwork moving along a
// track of `track` points, with detent haptics and a live readout.
function usePracticeDrag(channel: PracticeChannel, track: number, vertical: boolean) {
  const { session } = useSession();
  const start = useSharedValue(0);
  const detents = useDetentHaptics(session.state.settings.haptics);
  const { position, setDb } = channel;
  const report = useCallback((value: number) => setDb(positionToDb(value)), [setDb]);
  const pan = useMemo(() => {
    const gesture = Gesture.Pan().enabled(track > 0);
    if (vertical) gesture.activeOffsetY([-3, 3]).failOffsetX([-10, 10]);
    else gesture.activeOffsetX([-3, 3]).failOffsetY([-10, 10]);
    return gesture.onStart(() => {
      'worklet';
      start.set(position.get()); detents.start(position.get() * track);
    }).onUpdate(event => {
      'worklet';
      const movement = vertical ? -event.translationY : event.translationX;
      const next = Math.max(0, Math.min(1, start.get() + movement / track));
      position.set(next); detents.move(next * track); scheduleOnRN(report, next);
    });
  }, [track, vertical, position, start, report, detents]);
  const step = useCallback((up: boolean) => {
    const next = Math.max(0, Math.min(1, position.get() + (up ? 0.05 : -0.05)));
    position.set(next); setDb(positionToDb(next));
  }, [position, setDb]);
  return { pan, step };
}

// The real handle artwork, centred on its track position by the parent's offset.
function PracticeHandle({ vertical, size = 1, style }: { vertical: boolean; size?: number; style: object }) {
  return <Animated.View style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 8 * size,
    boxShadow: [{ offsetX: 1, offsetY: 4, blurRadius: 4, color: '#000000B3' }] },
    vertical ? { left: -FADER_CAP_WIDTH * size / 2, top: -FADER_CAP_HEIGHT * size / 2, width: FADER_CAP_WIDTH * size, height: FADER_CAP_HEIGHT * size }
      : { left: -FADER_CAP_HEIGHT / 2, top: 3 - FADER_CAP_WIDTH / 2, width: FADER_CAP_HEIGHT, height: FADER_CAP_WIDTH }, style]}>
    <Image source={faderArtwork} resizeMode="stretch" style={{ width: FADER_CAP_WIDTH * size, height: FADER_CAP_HEIGHT * size,
      transform: vertical ? [] : [{ rotate: '90deg' }] }} />
  </Animated.View>;
}

// A practice bar with the same hold-to-open as the mixer: holding the bar
// (not the handle) lifts it and opens the tall practice fader.
function PracticeFader({ channel, onEnlarge }: { channel: PracticeChannel; onEnlarge(): void }) {
  const theme = useTheme(), { session } = useSession();
  const [track, setTrack] = useState(0);
  const { pan, step } = usePracticeDrag(channel, track, false);
  const lift = useSharedValue(1);
  const holdAllowed = useSharedValue(false);
  const reducedMotion = useReducedMotion();
  const opened = useCallback(() => {
    if (session.state.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    onEnlarge();
  }, [session, onEnlarge]);
  // Touches within the handle's span drag instead of opening.
  const onHandle = useCallback((x: number) => {
    'worklet';
    const centre = FADER_CAP_HEIGHT / 2 + track * channel.position.get();
    return Math.abs(x - centre) <= FADER_CAP_HEIGHT / 2 + 4;
  }, [track, channel.position]);
  const hold = useMemo(() => Gesture.LongPress().minDuration(HOLD_DELAY + HOLD_LIFT).maxDistance(3).onBegin(event => {
    'worklet';
    holdAllowed.set(!onHandle(event.x));
    if (!holdAllowed.get() || reducedMotion) return;
    lift.set(withDelay(HOLD_DELAY, withTiming(HOLD_SCALE, { duration: HOLD_LIFT, easing: Easing.out(Easing.quad) })));
  }).onStart(() => {
    'worklet';
    if (holdAllowed.get()) scheduleOnRN(opened);
  }).onFinalize(() => {
    'worklet';
    holdAllowed.set(false);
    lift.set(reducedMotion ? 1 : withSpring(1, { duration: 200, dampingRatio: 0.7 }));
  }), [lift, holdAllowed, onHandle, opened, reducedMotion]);
  const gesture = useMemo(() => Gesture.Simultaneous(pan, hold), [pan, hold]);
  const liftStyle = useAnimatedStyle(() => ({ transform: [{ scale: lift.get() }] }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: track * channel.position.get() }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: track * channel.position.get() }));
  const text = levelText(channel.db, 'level');
  return <View style={{ gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 }}>
      <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: '600' }}>{channel.label}</Text>
      <LcdReadout>{text}</LcdReadout>
    </View>
    <Animated.View style={liftStyle}><FaderHousing vertical={false}>
      <GestureDetector gesture={gesture}>
        <View accessible accessibilityRole="adjustable" accessibilityLabel={channel.label + ' practice fader'} accessibilityValue={{ text }}
          accessibilityHint="Touch and hold to open a full-screen practice fader"
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'expand', label: 'Open full-screen fader' }]}
          onAccessibilityAction={event => event.nativeEvent.actionName === 'expand' ? opened() : step(event.nativeEvent.actionName === 'increment')}
          style={{ height: 56, justifyContent: 'center' }}>
          <View onLayout={event => setTrack(event.nativeEvent.layout.width)} style={{ marginHorizontal: FADER_CAP_HEIGHT / 2, height: 6, justifyContent: 'center' }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: '#000000' }} />
            <Animated.View style={[{ position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: theme.dark ? '#48D8C4' : '#7EEBD0' }, fillStyle]} />
            <PracticeHandle vertical={false} style={thumbStyle} />
          </View>
        </View>
      </GestureDetector>
    </FaderHousing></Animated.View>
  </View>;
}

// The tall practice fader, shown over the setup screen like the mixer's.
function PracticeFocus({ channel, onClose }: { channel: PracticeChannel; onClose(): void }) {
  const theme = useTheme(), insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  const size = 1.6, inset = FADER_CAP_HEIGHT * size / 2 + 6;
  const track = Math.max(0, height - inset * 2);
  const { pan, step } = usePracticeDrag(channel, track, true);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateY: track * (1 - channel.position.get()) }] }));
  const fillStyle = useAnimatedStyle(() => ({ height: track * channel.position.get() }));
  const text = levelText(channel.db, 'level');
  return <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12, paddingHorizontal: 20, gap: 16 }}>
    <AppBackground />
    <View style={{ alignSelf: 'center', width: 88 * size }}>
      <View style={{ borderRadius: 8, padding: 4, backgroundColor: '#071921', borderWidth: 1, borderColor: '#497886' }}>
        <View style={{ borderRadius: 4, paddingVertical: 8, alignItems: 'center', backgroundColor: '#81E9E5', borderWidth: 1, borderColor: '#ADFFEF' }}>
          <Text style={{ color: '#07343D', fontSize: 17, fontWeight: '700' }}>{channel.label}</Text>
          <Text style={{ color: '#07343D', fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'], fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{text}</Text>
        </View>
      </View>
    </View>
    <View onLayout={event => setHeight(event.nativeEvent.layout.height - 24)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {height > 0 && <FaderHousing vertical size={size}>
        <GestureDetector gesture={pan}>
          <View accessible accessibilityRole="adjustable" accessibilityLabel={channel.label + ' practice fader'} accessibilityValue={{ text }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={event => step(event.nativeEvent.actionName === 'increment')}
            style={{ height, width: 80 * size, alignItems: 'center' }}>
            <View style={{ position: 'absolute', top: inset, bottom: inset, width: 8, borderRadius: 4, backgroundColor: '#010709', justifyContent: 'flex-end' }}>
              <Animated.View style={[{ width: 8, borderRadius: 4, backgroundColor: theme.dark ? '#48D8C4' : '#7EEBD0' }, fillStyle]} />
            </View>
            <View style={{ position: 'absolute', top: inset, left: 40 * size }}>
              <PracticeHandle vertical size={size} style={thumbStyle} />
            </View>
          </View>
        </GestureDetector>
      </FaderHousing>}
    </View>
    <View style={{ alignItems: 'center' }}><CloseButton label="Close full-screen practice fader" onPress={onClose} /></View>
  </View>;
}

function Adjust() {
  const channels = [usePracticeChannel('Keys', -6), usePracticeChannel('Click', 2.4)];
  const [focused, setFocused] = useState<number | null>(null);
  return <View style={{ gap: 14 }}>
    {channels.map((channel, index) => <PracticeFader key={channel.label} channel={channel} onEnlarge={() => setFocused(index)} />)}
    <View style={{ alignItems: 'center' }}><Engraved size={10}>Drag a handle, or hold a fader</Engraved></View>
    <Modal visible={focused !== null} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setFocused(null)}>
      {focused !== null && <PracticeFocus channel={channels[focused]} onClose={() => setFocused(null)} />}
    </Modal>
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
