import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
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
import FaderHousing from '../../../src/components/FaderHousing';
import FaderDisplay from '../../../src/components/FaderDisplay';
import GroupExpandTarget from '../../../src/components/GroupExpandTarget';
import CloseButton from '../../../src/components/CloseButton';
import { FADER_INSET } from '../../../src/components/faderGeometry';
import MixerToolbar from '../../../src/components/MixerToolbar';
import AuxPresence from '../../../src/components/AuxPresence';
import MixerLoadingBoundary from '../../../src/components/MixerLoadingBoundary';
import { useLandscapeEdgePadding } from '../../../src/components/useLandscapeEdgePadding';
import LandscapeMixerToolbar from '../../../src/components/LandscapeMixerToolbar';
import FaderFocusTransition from '../../../src/components/FaderFocusTransition';
import ExpandableFader from '../../../src/components/ExpandableFader';

export default function Mixer() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscapeEdges = useLandscapeEdgePadding(insets.left, insets.right);
  const landscape = width > height;
  const [bankHeight, setBankHeight] = useState(height);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [focused, setFocused] = useState<number | null>(null);
  useEffect(() => { setFocused(null); }, [state.server, mix.aux, mix.parameter, landscape]);
  useEffect(() => { setExpanded([]); }, [state.server, mix.aux, state.preferences.groupsByAux, state.preferences.globalGroups]);
  useFocusEffect(useCallback(() => {
    if (session.mixer.state.status === 'connected') session.mixer.refresh();
    return () => session.mixer.cancelWrites();
  }, [session]));
  const hidden = hiddenChannels(mix.config, state.preferences, mix.aux);
  const sections = useMemo(() => mixerSections(mixerRows(mix.config, state.preferences, mix.aux, expanded, mix.parameter === 'pan')),
    [mix.config, mix.aux, mix.parameter, expanded, state.preferences]);
  const focusedRow = !landscape && focused !== null ? sections.flatMap(section => [section.header, ...section.channels]).find(row => row.channel === focused) : undefined;
  const closeFocused = () => { session.mixer.cancelWrites(); setFocused(null); };
  const topPadding = landscape ? insets.top + 12 : 20;
  const bottomPadding = insets.bottom + (landscape ? 12 : 20);
  // Every landscape strip starts at its LCD. The group's name and close control
  // have their own side rail, leaving equal widths and travel for every member.
  const cardHeight = Math.max(108 + FADER_INSET * 2, bankHeight - topPadding - bottomPadding);
  const stripHeight = Math.max(FADER_INSET * 2, cardHeight - 108);
  const renderSection = useCallback(({ item }: { item: MixerSection }) => {
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
    const renderFader = (channel: MixerRow) => <View key={channel.channel} testID={'channel-' + channel.channel}
      style={landscape ? { width: grouped && !open ? 136 : 88, alignItems: 'center', gap: 8 } : { gap: 8 }}>
      {landscape ? grouped && !open ? <GroupExpandTarget label={group.label} onExpand={expand}>
        <FaderDisplay channel={channel.channel} label={channel.label} expandable />
      </GroupExpandTarget> : <FaderDisplay channel={channel.channel} label={channel.label} /> : !channel.members && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 }}>
        <Text numberOfLines={2} style={{ color: theme.text, fontSize: 15, fontWeight: '600', flex: 1 }}>{channel.label}</Text>
        <FaderValue channel={channel.channel} />
      </View>}
      <View style={landscape ? { width: 88, alignSelf: grouped && !open ? 'center' : 'flex-start' } : undefined}>
        {landscape ? <FaderHousing vertical><Fader channel={channel.channel} label={channel.label} vertical length={stripHeight} /></FaderHousing>
          : <ExpandableFader channel={channel.channel} label={channel.label} onEnlarge={() => {
            session.mixer.cancelWrites(); setFocused(channel.channel);
          }} />}
      </View>
    </View>;
    return <View testID={grouped ? 'group-' + group.channel : undefined} style={{
      height: landscape ? cardHeight : undefined, width: landscape ? (grouped ? (open ? item.channels.length * (88 + 6) + 44 : 136) + 12 : 96) : undefined,
      marginRight: landscape ? 8 : 0, marginBottom: landscape ? 0 : 16,
      ...(grouped ? { borderWidth: 2, borderColor: theme.groupEdge, borderRadius: 16, backgroundColor: theme.groupSurface,
        paddingHorizontal: landscape ? 4 : 10, paddingTop: landscape ? 4 : 0, paddingBottom: landscape ? 4 : 12 }
        : landscape ? { paddingHorizontal: 4, paddingVertical: 6 } : {}),
    }}>
      {grouped && !landscape && (open ? <View style={{ minHeight: 48, paddingHorizontal: 6, gap: 8,
        flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.line, marginBottom: 10 }}>
        <Icon name={{ ios: 'link', android: 'link', web: 'link' }} size={14} />
        <Text numberOfLines={2} accessibilityRole="header" style={{ flex: 1, minWidth: 0, color: theme.text, fontSize: 15, fontWeight: '700' }}>{group.label}</Text>
        {canClose ? <CloseButton label={'Close ' + group.label + ' group'} onPress={close} />
          : <Text style={{ color: theme.muted, fontSize: 11 }}>Pan</Text>}
      </View> : <GroupExpandTarget label={group.label} onExpand={expand}>
        <View style={{ minHeight: 48, paddingHorizontal: 6, gap: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Icon name={{ ios: 'link', android: 'link', web: 'link' }} size={14} />
          <Text numberOfLines={2} style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: '700' }}>{group.label}</Text>
          <FaderValue channel={group.channel} />
          <Icon name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={16} />
        </View>
      </GroupExpandTarget>)}
      <View style={{ flexDirection: landscape ? 'row' : 'column', gap: landscape ? 6 : 16 }}>
        {landscape && open && <View style={{ width: 44, height: cardHeight - 12, alignItems: 'center' }}>
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
        {(open ? item.channels : [group]).map(renderFader)}
      </View>
    </View>;
  }, [landscape, cardHeight, stripHeight, theme, mix.parameter, session, expanded]);
  return <Page title={mix.config?.aux.find(aux => aux.channel === mix.aux)?.label || 'Mixer'} scroll={false} compactHeader hideHeader={landscape} toolbar={<MixerToolbar />}>
    <AuxPresence />
    <View style={{ flex: 1, flexDirection: landscape ? 'row' : 'column', paddingLeft: landscape ? landscapeEdges.paddingLeft : 0 }}>
    {landscape && <LandscapeMixerToolbar top={topPadding} bottom={bottomPadding} />}
    <View style={{ flex: 1 }}>
    <MixerLoadingBoundary>{!state.server ? <EmptyMixer /> : <FaderFocusTransition row={focusedRow} onClose={closeFocused}>
    <FlatList key={landscape ? 'strips' : 'rows'} horizontal={landscape} onLayout={event => setBankHeight(event.nativeEvent.layout.height)} extraData={state.preferences}
      data={sections} renderItem={renderSection} keyExtractor={item => String(item.header.channel)} contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: topPadding, ...(landscape ? { paddingLeft: 8, paddingRight: landscapeEdges.paddingRight } : { paddingLeft: 20, paddingRight: 20 }), paddingBottom: bottomPadding }} keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
        <Icon name={{ ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }} size={34} color={theme.muted} />
        <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>{hidden.length ? 'All channels hidden' : 'No channels'}</Text>
        <Text style={{ color: theme.muted, textAlign: 'center', lineHeight: 22 }}>{hidden.length ? 'Use Edit to show channels.' : 'Check the server’s desk connection.'}</Text>
        {hidden.length > 0 && <NativeButton title="Edit channels" onPress={() => router.push('/layout')} />}
      </View>} /></FaderFocusTransition>}</MixerLoadingBoundary>
    </View>
    </View>
  </Page>;
}
