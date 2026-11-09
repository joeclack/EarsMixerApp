import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../../src/mixer/context';
import { useTheme } from '../../../src/theme';
import { hiddenChannels } from '../../../src/mixer/model';
import { mixerRows, type MixerRow } from '../../../src/mixer/groups';
import { Page, EmptyMixer, Icon } from '../../../src/components/ui';
import NativeButton from '../../../src/components/NativeButton';
import Fader, { FaderValue } from '../../../src/components/Fader';
import FaderHousing from '../../../src/components/FaderHousing';
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
  const topPadding = landscape ? insets.top + 12 : 20;
  const bottomPadding = insets.bottom + (landscape ? 12 : 20);
  const cardHeight = Math.max(96 + FADER_INSET * 2, bankHeight - topPadding - bottomPadding);
  const stripHeight = Math.max(FADER_INSET * 2, cardHeight - 96);
  useFocusEffect(useCallback(() => {
    // Cached positions remain visible while fresh desk values are requested.
    if (session.mixer.state.status === 'connected') session.mixer.refresh();
    return () => session.mixer.cancelWrites();
  }, [session]));
  const hidden = hiddenChannels(mix.config, state.preferences, mix.aux);
  const channels = useMemo(() => mixerRows(mix.config, state.preferences, mix.aux, expanded, mix.parameter === 'pan'), [mix.config, mix.aux, mix.parameter, expanded, state.preferences]);
  const renderChannel = useCallback(({ item }: { item: MixerRow }) => {
    const open = !!item.members && (expanded.includes(item.channel) || mix.parameter === 'pan');
    const toggle = () => {
      session.mixer.cancelWrites();
      setExpanded(ids => ids.includes(item.channel) ? ids.filter(id => id !== item.channel) : [...ids, item.channel]);
    };
    return <View testID={'channel-' + item.channel} style={{ height: landscape ? cardHeight : undefined, width: landscape ? (item.members ? 144 : 76) : undefined, marginRight: landscape ? 6 : 0, marginBottom: landscape ? 0 : 12,
      ...(item.group ? { borderLeftWidth: 2, borderLeftColor: theme.tint, paddingLeft: landscape ? 4 : 10 } : {}) }}>
    <View style={{ height: landscape ? (item.members ? 120 : 64) : undefined, marginBottom: 8, paddingHorizontal: landscape ? 0 : 8, flexShrink: 0, flexDirection: landscape ? 'column' : 'row', alignItems: 'center', gap: landscape ? 6 : 10 }}>
      <Text numberOfLines={landscape || item.members ? 2 : 1} style={{ color: theme.text, fontSize: landscape ? 12 : 15, minHeight: landscape ? 34 : undefined, textAlign: landscape ? 'center' : 'left', fontWeight: '600', flex: landscape ? undefined : 1 }}>{item.label}</Text>
      {item.members && <Icon name={{ ios: 'link', android: 'link', web: 'link' }} size={16} />}
      {(!item.members || !open) && <FaderValue channel={item.channel} />}
      {item.members && mix.parameter !== 'pan' && <NativeButton title={open ? 'Close' : 'Open'} accessibilityLabel={(open ? 'Close ' : 'Open ') + item.label + ' group'} onPress={toggle} />}
    </View>
    {!open && <FaderHousing vertical={landscape}>
      <Fader channel={item.channel} label={item.label} vertical={landscape} length={Math.max(80, stripHeight - (item.members ? 56 : 0))} />
    </FaderHousing>}
    {item.members && open && <Text style={{ color: theme.muted, fontSize: 12, padding: 8 }}>{mix.parameter === 'pan' ? 'Adjust pan individually' : landscape ? 'Adjust channels beside this group' : 'Adjust channels below'}</Text>}
  </View>;
  }, [landscape, cardHeight, stripHeight, theme.text, theme.tint, theme.muted, expanded, mix.parameter, session]);
  return <Page title={mix.config?.aux.find(aux => aux.channel === mix.aux)?.label || 'Mixer'} scroll={false} compactHeader hideHeader={landscape} toolbar={<MixerToolbar />}>
    <AuxPresence />
    <MixerLoadingBoundary>{!state.server ? <EmptyMixer /> : <FlatList key={landscape ? 'strips' : 'rows'} horizontal={landscape} onLayout={event => setBankHeight(event.nativeEvent.layout.height)} extraData={state.preferences}
      data={channels} renderItem={renderChannel} keyExtractor={item => String(item.channel)} contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: topPadding, paddingLeft: landscape ? insets.left + 20 : 20, paddingRight: landscape ? insets.right + 20 : 20, paddingBottom: bottomPadding }} keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
        <Icon name={{ ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }} size={34} color={theme.muted} />
        <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>{hidden.length ? 'All channels hidden' : 'No channels'}</Text>
        <Text style={{ color: theme.muted, textAlign: 'center', lineHeight: 22 }}>{hidden.length ? 'Use Edit to show channels.' : 'Check the server’s desk connection.'}</Text>
        {hidden.length > 0 && <NativeButton title="Edit channels" onPress={() => router.push('/layout')} />}
      </View>} />}</MixerLoadingBoundary>
  </Page>;
}
