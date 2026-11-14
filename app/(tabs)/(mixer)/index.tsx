import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, LinearTransition, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { TEXT_SCALE } from '../../../src/mixer/session';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSession } from '../../../src/mixer/context';
import { useTheme } from '../../../src/theme';
import { hiddenChannels } from '../../../src/mixer/model';
import { mixerRows, mixerSections, type MixerRow, type MixerSection } from '../../../src/mixer/groups';
import { Page, EmptyMixer, Icon } from '../../../src/components/ui';
import NativeButton from '../../../src/components/NativeButton';
import Fader, { FaderValue } from '../../../src/components/Fader';
import { MuteKey } from '../../../src/components/MuteButton';
import GroupExpandTarget from '../../../src/components/GroupExpandTarget';
import CloseButton from '../../../src/components/CloseButton';
import { FADER_INSET } from '../../../src/components/faderGeometry';
import MixerToolbar from '../../../src/components/MixerToolbar';
import AuxPresence from '../../../src/components/AuxPresence';
import ConnectionNotice from '../../../src/components/ConnectionNotice';
import MixerLoadingBoundary from '../../../src/components/MixerLoadingBoundary';
import { useLandscapeEdgePadding } from '../../../src/components/useLandscapeEdgePadding';
import LandscapeMixerToolbar from '../../../src/components/LandscapeMixerToolbar';
import { useStableMixerLayout } from '../../../src/components/useStableMixerLayout';
import LandscapeFaderViewport from '../../../src/components/LandscapeFaderViewport';

// Landscape strip geometry: the level row above the fader and the name row below.
// Names are one line so the fader keeps as much height as possible.
// Top to bottom: a MUTE key, the level, the fader and the name.
const STRIP_WIDTH = 96, STRIP_PADDING = 4, STRIP_GAP = 2, MUTE_ROW = 26, LEVEL_ROW = 18, NAME_ROW = 18;
// Text size grows the level and name rows; hiding levels gives their row to the fader.
const stripChrome = (levelRow: number, nameRow: number) => STRIP_PADDING * 2 + STRIP_GAP * (levelRow ? 3 : 2) + MUTE_ROW + levelRow + nameRow;
// Opening or closing a group slides it open or shut, pushing the channels
// after it along; its members fade in as they are uncovered.
const groupSlide = LinearTransition.duration(280).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System);
const memberIn = FadeIn.duration(220).reduceMotion(ReduceMotion.System);
const memberOut = FadeOut.duration(140).reduceMotion(ReduceMotion.System);
// An open group's edge, and on iPad landscape the name bar beneath its members.
const GROUP_EDGE = 2, GROUP_FOOTER = 44;

export default function Mixer() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscapeEdges = useLandscapeEdgePadding(insets.left, insets.right);
  const landscape = width > height;
  // iPad landscape has the height for the top toolbar, so it keeps the portrait
  // toolbar and gives the rail's width to the faders.
  const pad = Platform.OS === 'ios' && Platform.isPad;
  const sideRail = landscape && !pad;
  // iPad landscape names an open group in a bar spanning its members, rather
  // than a narrow rotated rail beside them.
  const groupFooter = landscape && pad;
  const [bankHeight, setBankHeight] = useState(height);
  const layoutReady = useStableMixerLayout([width, height, insets.top, insets.bottom, insets.left, insets.right,
    landscapeEdges.paddingLeft, landscapeEdges.paddingRight, bankHeight].join('|'), landscape ? 'landscape' : 'portrait');
  // Hide stale geometry immediately, then fade the settled layout in on the UI
  // thread rather than letting faders visibly resize through each stage.
  // Only a rotation fades in; other single-frame hides return immediately.
  const reveal = useSharedValue(1);
  const revealedOrientation = useRef(landscape);
  useLayoutEffect(() => {
    if (!layoutReady) { cancelAnimation(reveal); reveal.set(0); return; }
    const rotated = revealedOrientation.current !== landscape;
    revealedOrientation.current = landscape;
    reveal.set(rotated ? withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }) : 1);
  }, [layoutReady, landscape, reveal]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: reveal.get() }));
  useEffect(() => { session.mixer.cancelWrites(); }, [landscape, session]);
  const [expanded, setExpanded] = useState<number[]>([]);
  useEffect(() => { setExpanded([]); }, [state.server, mix.aux, state.preferences.groupsByAux, state.preferences.globalGroups]);
  useFocusEffect(useCallback(() => {
    if (session.mixer.state.status === 'connected') session.mixer.refresh();
    return () => session.mixer.cancelWrites();
  }, [session]));
  const hidden = hiddenChannels(mix.config, state.preferences, mix.aux);
  const sections = useMemo(() => mixerSections(mixerRows(mix.config, state.preferences, mix.aux, expanded, mix.parameter === 'pan')),
    [mix.config, mix.aux, mix.parameter, expanded, state.preferences]);
  const topPadding = sideRail ? insets.top + 12 : 20;
  // In landscape the one-line names sit just above the home indicator.
  const bottomPadding = landscape ? Math.max(6, insets.bottom - 10) : insets.bottom + 20;
  // Each landscape strip has three rows: its level, the fader, and its name.
  // The fader takes all the height the level and name rows leave. An open
  // group's name and close control have their own side rail, leaving equal
  // widths and travel for every member.
  const textScale = TEXT_SCALE[state.settings.textSize], showLevels = state.settings.showLevels;
  const levelRow = showLevels ? Math.round(LEVEL_ROW * textScale) : 0, nameRow = Math.round(NAME_ROW * textScale);
  const chrome = stripChrome(levelRow, nameRow);
  const cardHeight = Math.max(chrome + FADER_INSET * 2, bankHeight - topPadding - bottomPadding);
  const stripHeight = Math.max(FADER_INSET * 2, cardHeight - chrome);
  const renderSection = useCallback(({ item, index }: { item: MixerSection; index: number }) => {
    const group = item.header;
    const grouped = !!group.members;
    const open = grouped && item.channels.length > 0;
    const canClose = open && mix.parameter !== 'pan';
    const expand = () => {
      if (expanded.includes(group.channel)) return;
      session.mixer.cancelWrites();
      setExpanded(ids => ids.includes(group.channel) ? ids : [...ids, group.channel]);
      if (session.state.settings.haptics) void Haptics.selectionAsync().catch(() => {});
    };
    const close = () => {
      if (!expanded.includes(group.channel)) return;
      session.mixer.cancelWrites();
      setExpanded(ids => ids.filter(id => id !== group.channel));
      if (session.state.settings.haptics) void Haptics.selectionAsync().catch(() => {});
    };
    // Faders sit straight on the desk, divided by fine lines: rows in portrait,
    // strips in landscape.
    const divider = (position: number) => position > 0 && (landscape
      ? { borderLeftWidth: 1, borderLeftColor: theme.deskDivider } : { borderTopWidth: 1, borderTopColor: theme.deskDivider });
    const member = open ? { entering: memberIn, exiting: memberOut } : {};
    // Open members give the group's top edge, and any name bar, their height.
    const memberShrink = open ? GROUP_EDGE + (groupFooter ? GROUP_FOOTER : 0) : 0;
    const renderFader = (channel: MixerRow, position: number) => landscape
      ? <Animated.View key={channel.channel} testID={'channel-' + channel.channel} {...member}
        style={{ width: STRIP_WIDTH, height: cardHeight - memberShrink, alignItems: 'center', paddingVertical: STRIP_PADDING, gap: STRIP_GAP, ...divider(position) }}>
        <MuteKey channel={channel.channel} label={channel.label} width={68} height={MUTE_ROW} />
        {showLevels && <View style={{ height: levelRow, justifyContent: 'center' }}><FaderValue channel={channel.channel} size={13 * textScale} /></View>}
        <Fader channel={channel.channel} label={channel.label} vertical length={stripHeight - memberShrink} />
        {grouped && !open ? <GroupExpandTarget label={group.label} onExpand={expand}>
          <View style={{ width: STRIP_WIDTH - 8, height: nameRow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <Icon name={{ ios: 'link', android: 'link', web: 'link' }} size={11} />
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ flexShrink: 1, color: theme.text, fontSize: 12 * textScale, lineHeight: 16 * textScale, fontWeight: '700', textAlign: 'center' }}>{group.label}</Text>
            <Icon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={11} />
          </View>
        </GroupExpandTarget> : <View style={{ width: STRIP_WIDTH - 8, height: nameRow, alignItems: 'center', justifyContent: 'center' }}>
          {/* Centred in the same row box as a group's name, so both sit on one line. */}
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ color: theme.text, fontSize: 12 * textScale, lineHeight: 16 * textScale,
            fontWeight: '600', textAlign: 'center' }}>{channel.label}</Text>
        </View>}
      </Animated.View>
      : <Animated.View key={channel.channel} testID={'channel-' + channel.channel} {...member}
        style={{ gap: 2, paddingTop: grouped && !open ? 0 : 10, paddingHorizontal: 4, paddingBottom: 4, ...divider(position) }}>
        {!channel.members && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 }}>
          <Text numberOfLines={2} style={{ color: theme.text, fontSize: 15 * textScale, fontWeight: '600', flex: 1 }}>{channel.label}</Text>
          <MuteKey channel={channel.channel} label={channel.label} width={56} height={24} />
          {showLevels && <View style={{ minWidth: 60 * textScale, alignItems: 'flex-end' }}><FaderValue channel={channel.channel} size={13 * textScale} /></View>}
        </View>}
        <Fader channel={channel.channel} label={channel.label} />
      </Animated.View>;
    // The section resizes with a slide; clipping it reveals or covers its members.
    return <Animated.View layout={groupSlide} testID={grouped ? 'group-' + group.channel : undefined} style={{
      overflow: grouped ? 'hidden' : undefined, height: landscape ? cardHeight : undefined, width: landscape ? (open ? item.channels.length * STRIP_WIDTH + (groupFooter ? GROUP_EDGE * 2 : 44) : STRIP_WIDTH) : undefined,
      ...divider(index),
    }}>
      {grouped && !landscape && (open ? <View style={{ minHeight: 48, paddingHorizontal: 16, gap: 8,
        flexDirection: 'row', alignItems: 'center' }}>
        <Icon name={{ ios: 'link', android: 'link', web: 'link' }} size={14} />
        <Text numberOfLines={2} accessibilityRole="header" style={{ flex: 1, minWidth: 0, color: theme.text, fontSize: 15 * textScale, fontWeight: '700' }}>{group.label}</Text>
        {canClose ? <CloseButton label={'Close ' + group.label + ' group'} onPress={close} />
          : <Text style={{ color: theme.muted, fontSize: 11 }}>Pan</Text>}
      </View> : <GroupExpandTarget label={group.label} onExpand={expand}>
        <View style={{ minHeight: 48, paddingHorizontal: 16, paddingTop: 6, gap: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Icon name={{ ios: 'link', android: 'link', web: 'link' }} size={14} />
          <Text numberOfLines={2} style={{ flex: 1, color: theme.text, fontSize: 15 * textScale, fontWeight: '700' }}>{group.label}</Text>
          <MuteKey channel={group.channel} label={group.label} width={56} height={24} />
          {showLevels && <View style={{ minWidth: 60 * textScale, alignItems: 'flex-end' }}><FaderValue channel={group.channel} size={13 * textScale} /></View>}
          <Icon name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={16} />
        </View>
      </GroupExpandTarget>)}
      <View style={{ flexDirection: landscape && !groupFooter ? 'row' : 'column',
        ...(open && (landscape ? { borderTopWidth: GROUP_EDGE, borderColor: theme.groupEdge,
          ...(groupFooter && { borderLeftWidth: GROUP_EDGE, borderRightWidth: GROUP_EDGE }) }
          : { marginLeft: 8, borderLeftWidth: 2, borderLeftColor: theme.groupEdge, borderTopWidth: 1, borderTopColor: theme.deskDivider })) }}>
        {sideRail && open && <View style={{ width: 44, height: cardHeight - 2, alignItems: 'center', paddingTop: STRIP_PADDING }}>
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            {canClose && <CloseButton label={'Close ' + group.label + ' group'} onPress={close} />}
          </View>
          <View style={{ width: 44, flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Text numberOfLines={1} accessibilityRole="header" accessibilityLabel={group.label} style={{
              width: Math.max(0, cardHeight - 64), height: 32, flexShrink: 0, textAlign: 'center', lineHeight: 32,
              color: theme.text, fontSize: 15, fontWeight: '700', transform: [{ rotate: '-90deg' }],
            }}>{group.label}</Text>
          </View>
        </View>}
        {groupFooter ? <View style={{ flexDirection: 'row' }}>
          {(open ? item.channels : [group]).map((channel, position) => renderFader(channel, position))}
        </View> : (open ? item.channels : [group]).map((channel, position) => renderFader(channel, position))}
        {groupFooter && open && <View style={{ height: GROUP_FOOTER, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 2,
          borderTopWidth: 1, borderTopColor: theme.deskDivider }}>
          <Icon name={{ ios: 'link', android: 'link', web: 'link' }} size={14} />
          <Text numberOfLines={1} accessibilityRole="header" style={{ flex: 1, minWidth: 0, color: theme.text, fontSize: 15 * textScale, fontWeight: '700' }}>{group.label}</Text>
          {canClose ? <CloseButton label={'Close ' + group.label + ' group'} onPress={close} />
            : <Text style={{ color: theme.muted, fontSize: 11, paddingRight: 10 }}>Pan</Text>}
        </View>}
      </View>
    </Animated.View>;
  }, [landscape, sideRail, groupFooter, cardHeight, stripHeight, theme, mix.parameter, session, expanded, textScale, showLevels, levelRow, nameRow]);
  return <Page title={mix.config?.aux.find(aux => aux.channel === mix.aux)?.label || 'Mixer'} scroll={false} compactHeader hideHeader={sideRail} toolbar={<MixerToolbar />} desk>
    <AuxPresence />
    {/* The plain opacity hides stale layout within the same commit; the
        animated layer then fades the settled layout in. */}
    <Animated.View style={[{ flex: 1 }, revealStyle]}>
    <View pointerEvents={layoutReady ? 'auto' : 'none'} accessibilityElementsHidden={!layoutReady}
      importantForAccessibility={layoutReady ? 'auto' : 'no-hide-descendants'} style={{ flex: 1, flexDirection: landscape ? 'row' : 'column',
      paddingLeft: landscape ? landscapeEdges.paddingLeft : 0, paddingRight: landscape ? landscapeEdges.paddingRight : 0, opacity: layoutReady ? 1 : 0 }}>
    {sideRail && <LandscapeMixerToolbar top={topPadding} bottom={bottomPadding} />}
    <View onLayout={event => setBankHeight(event.nativeEvent.layout.height)} style={{ flex: 1, minWidth: 0, overflow: landscape ? 'hidden' : 'visible' }}>
    <LandscapeFaderViewport enabled={landscape}>
    <MixerLoadingBoundary>{!state.server ? <EmptyMixer /> : <View style={{ flex: 1 }}>
    <Animated.FlatList itemLayoutAnimation={groupSlide} key={landscape ? 'strips' : 'rows'} horizontal={landscape} extraData={[state.preferences, state.settings]}
      data={sections} renderItem={renderSection} keyExtractor={item => String(item.header.channel)} contentInsetAdjustmentBehavior="never"
      // Portrait faders sit straight on the desk, divided by fine lines.
      contentContainerStyle={{ paddingTop: topPadding, paddingLeft: landscape ? 16 : 4, paddingRight: landscape ? 16 : 4, paddingBottom: bottomPadding }} keyboardShouldPersistTaps="handled"
      // Demo meters are labelled so they are never mistaken for the desk's signal.
      ListHeaderComponent={!landscape && sections.length && (mix.locked || (mix.config?.meters === 'simulated' && state.settings.showMeters)) ? <View style={{ paddingHorizontal: 12, paddingBottom: 6, gap: 6 }}>
        {/* While locked, a bar says so and unlocks with a tap, so a locked mixer is never a mystery. */}
        {mix.locked && <Pressable accessibilityRole="button" accessibilityLabel="Faders locked. Unlock faders" onPress={() => session.mixer.setLocked(false)}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, borderRadius: 10,
            backgroundColor: theme.secondary, opacity: pressed ? 0.7 : 1 })}>
          <Icon name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} size={15} color={theme.tint} />
          <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: '600' }}>Faders locked</Text>
          <Text style={{ color: theme.tint, fontSize: 15, fontWeight: '600' }}>Unlock</Text>
        </Pressable>}
        {/* Demo meters are labelled so they are never mistaken for the desk's signal. */}
        {mix.config?.meters === 'simulated' && state.settings.showMeters && <Text style={{ color: theme.muted, fontSize: 11, paddingHorizontal: 4 }}>Signal meters are simulated</Text>}
      </View> : undefined}
      ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
        <Icon name={{ ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }} size={34} color={theme.muted} />
        <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>{hidden.length ? 'All channels hidden' : 'No channels'}</Text>
        <Text style={{ color: theme.muted, textAlign: 'center', lineHeight: 22 }}>{hidden.length ? 'Use Edit to show channels.' : 'Check the server’s desk connection.'}</Text>
        {hidden.length > 0 && <NativeButton title="Edit channels" onPress={() => router.push('/layout')} />}
      </View>} /></View>}</MixerLoadingBoundary>
    </LandscapeFaderViewport>
    </View>
    </View>
    </Animated.View>
    <ConnectionNotice />
  </Page>;
}
