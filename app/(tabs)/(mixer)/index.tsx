import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../../src/mixer/context';
import { useTheme } from '../../../src/theme';
import { hiddenChannels } from '../../../src/mixer/model';
import { mixerRows, mixerSections, type MixerRow, type MixerSection } from '../../../src/mixer/groups';
import { Page, EmptyMixer, Icon } from '../../../src/components/ui';
import NativeButton from '../../../src/components/NativeButton';
import Fader, { FaderValue } from '../../../src/components/Fader';
import FaderHousing from '../../../src/components/FaderHousing';
import FaderDisplay from '../../../src/components/FaderDisplay';
import { FADER_INSET } from '../../../src/components/faderGeometry';
import MixerToolbar from '../../../src/components/MixerToolbar';
import AuxPresence from '../../../src/components/AuxPresence';
import MixerLoadingBoundary from '../../../src/components/MixerLoadingBoundary';

export default function Mixer() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = width > height;
  const [bankHeight, setBankHeight] = useState(height);
  const [expanded, setExpanded] = useState<number[]>([]);
  useEffect(() => { setExpanded([]); }, [state.server, mix.aux, state.preferences.groupsByAux]);
  useFocusEffect(useCallback(() => {
    if (session.mixer.state.status === 'connected') session.mixer.refresh();
    return () => session.mixer.cancelWrites();
  }, [session]));
  const hidden = hiddenChannels(mix.config, state.preferences, mix.aux);
  const sections = useMemo(() => mixerSections(mixerRows(mix.config, state.preferences, mix.aux, expanded, mix.parameter === 'pan')),
    [mix.config, mix.aux, mix.parameter, expanded, state.preferences]);
  const topPadding = landscape ? insets.top + 12 : 20;
  const bottomPadding = insets.bottom + (landscape ? 12 : 20);
  // One shared header rail keeps every LCD and fader aligned, grouped or not.
  const railHeight = sections.some(section => section.header.members) ? 48 : 0;
  const cardHeight = Math.max(106 + railHeight + FADER_INSET * 2, bankHeight - topPadding - bottomPadding);
  const stripHeight = Math.max(FADER_INSET * 2, cardHeight - 106 - railHeight);
  const renderSection = useCallback(({ item }: { item: MixerSection }) => {
    const group = item.header;
    const grouped = !!group.members;
    const open = grouped && item.channels.length > 0;
    const toggle = () => {
      session.mixer.cancelWrites();
      setExpanded(ids => ids.includes(group.channel) ? ids.filter(id => id !== group.channel) : [...ids, group.channel]);
    };
    const renderFader = (channel: MixerRow) => <View key={channel.channel} testID={'channel-' + channel.channel}
      style={landscape ? { width: grouped && !open ? 136 : 88, alignItems: 'center', gap: 8 } : { gap: 8 }}>
      {landscape ? <FaderDisplay channel={channel.channel} label={channel.label} /> : !channel.members && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 }}>
        <Text numberOfLines={2} style={{ color: theme.text, fontSize: 15, fontWeight: '600', flex: 1 }}>{channel.label}</Text>
        <FaderValue channel={channel.channel} />
      </View>}
      <FaderHousing vertical={landscape}><Fader channel={channel.channel} label={channel.label} vertical={landscape} length={stripHeight} /></FaderHousing>
    </View>;
    return <View testID={grouped ? 'group-' + group.channel : undefined} style={{
      height: landscape ? cardHeight : undefined, width: landscape ? (grouped ? (open ? item.channels.length * 96 - 8 : 136) + 12 : 96) : undefined,
      marginRight: landscape ? 8 : 0, marginBottom: landscape ? 0 : 16,
      ...(grouped ? { borderWidth: 2, borderColor: theme.groupEdge, borderRadius: 16, backgroundColor: theme.groupSurface,
        paddingHorizontal: landscape ? 4 : 10, paddingTop: landscape ? 2 : 0, paddingBottom: landscape ? 4 : 12 }
        : landscape ? { borderWidth: 1, borderColor: theme.consoleRed, borderRadius: 12, borderBottomLeftRadius: 44,
          borderBottomRightRadius: 44, paddingHorizontal: 3, paddingVertical: 4, backgroundColor: theme.stripSurface } : {}),
    }}>
      {grouped ? <View style={{ minHeight: landscape ? railHeight : 48, paddingHorizontal: 6, gap: 8,
        flexDirection: 'row', alignItems: 'center', borderBottomWidth: open && !landscape ? 1 : 0, borderBottomColor: theme.line,
        marginBottom: landscape ? 0 : 10 }}>
        <Icon name={{ ios: 'link', android: 'link', web: 'link' }} size={14} />
        <Text numberOfLines={landscape ? 1 : 2} accessibilityRole="header" style={{ flex: 1, minWidth: 0, color: theme.text, fontSize: landscape ? 11 : 15, fontWeight: '700' }}>
          {landscape && !open ? group.members!.length + ' linked' : group.label}
        </Text>
        {!landscape && !open && <FaderValue channel={group.channel} />}
        {mix.parameter !== 'pan' ? <NativeButton compact title={open ? 'Close' : 'Open'} accessibilityLabel={(open ? 'Close ' : 'Open ') + group.label + ' group'} onPress={toggle} />
          : <Text style={{ color: theme.muted, fontSize: 11 }}>Pan</Text>}
      </View> : landscape && railHeight > 0 ? <View style={{ height: railHeight }} /> : null}
      <View style={{ flexDirection: landscape ? 'row' : 'column', gap: landscape ? 8 : 16 }}>
        {(open ? item.channels : [group]).map(renderFader)}
      </View>
    </View>;
  }, [landscape, cardHeight, stripHeight, railHeight, theme, mix.parameter, session]);
  return <Page title={mix.config?.aux.find(aux => aux.channel === mix.aux)?.label || 'Mixer'} scroll={false} compactHeader hideHeader={landscape} toolbar={<MixerToolbar />}>
    <AuxPresence />
    <MixerLoadingBoundary>{!state.server ? <EmptyMixer /> : <FlatList key={landscape ? 'strips' : 'rows'} horizontal={landscape} onLayout={event => setBankHeight(event.nativeEvent.layout.height)} extraData={state.preferences}
      data={sections} renderItem={renderSection} keyExtractor={item => String(item.header.channel)} contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: topPadding, paddingLeft: landscape ? insets.left + 20 : 20, paddingRight: landscape ? insets.right + 20 : 20, paddingBottom: bottomPadding }} keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
        <Icon name={{ ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }} size={34} color={theme.muted} />
        <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>{hidden.length ? 'All channels hidden' : 'No channels'}</Text>
        <Text style={{ color: theme.muted, textAlign: 'center', lineHeight: 22 }}>{hidden.length ? 'Use Edit to show channels.' : 'Check the server’s desk connection.'}</Text>
        {hidden.length > 0 && <NativeButton title="Edit channels" onPress={() => router.push('/layout')} />}
      </View>} />}</MixerLoadingBoundary>
  </Page>;
}
