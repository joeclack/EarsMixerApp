import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../../src/mixer/context';
import { useTheme } from '../../../src/theme';
import { orderedChannels, hiddenChannels, type Channel } from '../../../src/mixer/model';
import { Page, EmptyMixer, Icon } from '../../../src/components/ui';
import NativeButton from '../../../src/components/NativeButton';
import Fader, { FaderValue } from '../../../src/components/Fader';
import MixerToolbar from '../../../src/components/MixerToolbar';

export default function Mixer() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const landscape = width > height;
  const [bankHeight, setBankHeight] = useState(height);
  const topPadding = landscape ? insets.top + 12 : 20;
  const bottomPadding = insets.bottom + (landscape ? 12 : 20);
  const cardHeight = Math.max(120, bankHeight - topPadding - bottomPadding);
  const stripHeight = Math.max(40, cardHeight - 96);
  useFocusEffect(useCallback(() => {
    // Cached positions remain visible while fresh desk values are requested.
    if (session.mixer.state.status === 'connected') session.mixer.refresh();
    return () => session.mixer.cancelWrites();
  }, [session]));
  const hidden = hiddenChannels(mix.config, state.preferences, mix.aux);
  const channels = useMemo(() => orderedChannels(mix.config, state.preferences).filter(channel => !hidden.includes(channel.channel)), [mix.config, mix.aux, state.preferences]);
  const renderChannel = useCallback(({ item }: { item: Channel }) => <View testID={'channel-' + item.channel} style={{ height: landscape ? cardHeight : undefined, width: landscape ? 76 : undefined, marginRight: landscape ? 6 : 0, marginBottom: landscape ? 0 : 12 }}>
    <View style={{ height: landscape ? 64 : undefined, marginBottom: 8, paddingHorizontal: landscape ? 0 : 8, flexShrink: 0, flexDirection: landscape ? 'column' : 'row', alignItems: 'center', gap: landscape ? 6 : 10 }}>
      <Text numberOfLines={landscape ? 2 : 1} style={{ color: theme.text, fontSize: landscape ? 12 : 15, minHeight: landscape ? 34 : undefined, textAlign: landscape ? 'center' : 'left', fontWeight: '600', flex: landscape ? undefined : 1 }}>{item.label}</Text>
      <FaderValue channel={item.channel} />
    </View>
    <View style={{ alignSelf: landscape ? 'center' : 'stretch', width: landscape ? 64 : undefined,
      borderRadius: 999, backgroundColor: theme.panel, borderWidth: 0.5, borderColor: theme.line,
      boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 5, spreadDistance: 1, color: theme.dark ? '#00000050' : '#00000018', inset: true }],
      paddingHorizontal: landscape ? 0 : 16, paddingVertical: landscape ? 12 : 4, overflow: 'hidden' }}>
      <Fader channel={item.channel} label={item.label} color={theme.tint} vertical={landscape} length={stripHeight} />
    </View>
  </View>, [landscape, cardHeight, stripHeight, theme.dark, theme.panel, theme.line, theme.text, theme.muted, theme.tint]);
  return <Page title={mix.config?.aux.find(aux => aux.channel === mix.aux)?.label || 'Mixer'} scroll={false} compactHeader hideHeader={landscape} toolbar={<MixerToolbar />}>
    {!state.server ? <EmptyMixer /> : <FlatList key={landscape ? 'strips' : 'rows'} horizontal={landscape} onLayout={event => setBankHeight(event.nativeEvent.layout.height)} extraData={state.preferences}
      data={channels} renderItem={renderChannel} keyExtractor={item => String(item.channel)} contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: topPadding, paddingLeft: landscape ? insets.left + 20 : 20, paddingRight: landscape ? insets.right + 20 : 20, paddingBottom: bottomPadding }} keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
        <Icon name={{ ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }} size={34} color={theme.muted} />
        <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>{hidden.length ? 'All channels hidden' : 'No channels'}</Text>
        <Text style={{ color: theme.muted, textAlign: 'center', lineHeight: 22 }}>{hidden.length ? 'Use Edit to show channels.' : 'Check the server’s desk connection.'}</Text>
        {hidden.length > 0 && <NativeButton title="Edit channels" onPress={() => router.push('/layout')} />}
      </View>} />}
  </Page>;
}
