import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../../../src/mixer/context';
import { useTheme } from '../../../src/theme';
import { orderedChannels, hiddenChannels, levelText, type Channel } from '../../../src/mixer/model';
import { Page, EmptyMixer, Icon } from '../../../src/components/ui';
import NativeButton from '../../../src/components/NativeButton';
import Segmented from '../../../src/components/Segmented';
import Fader from '../../../src/components/Fader';
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
  const stripHeight = Math.max(40, cardHeight - 80);
  useFocusEffect(useCallback(() => {
    // Cached positions remain visible while fresh desk values are requested.
    if (session.mixer.state.status === 'connected') session.mixer.refresh();
    return () => session.mixer.cancelWrites();
  }, [session]));
  const hidden = hiddenChannels(mix.config, state.preferences, mix.aux);
  const channels = useMemo(() => orderedChannels(mix.config, state.preferences).filter(channel => !hidden.includes(channel.channel)), [mix.config, mix.aux, state.preferences]);
  const renderChannel = ({ item }: { item: Channel }) => <View testID={'channel-' + item.channel} style={{ height: landscape ? cardHeight : undefined, overflow: 'hidden', width: landscape ? 76 : undefined, marginRight: landscape ? 6 : 0, paddingHorizontal: landscape ? 6 : 12, paddingVertical: landscape ? 8 : 6, borderRadius: 14, backgroundColor: theme.panel, marginBottom: 6 }}>
    <View style={{ height: landscape ? 64 : undefined, flexShrink: 0, flexDirection: landscape ? 'column' : 'row', alignItems: 'center', gap: landscape ? 6 : 10 }}>
      <Text numberOfLines={landscape ? 2 : 1} style={{ color: theme.text, fontSize: landscape ? 12 : 15, minHeight: landscape ? 34 : undefined, textAlign: landscape ? 'center' : 'left', fontWeight: '600', flex: landscape ? undefined : 1 }}>{item.label}</Text>
      {<Text style={{ color: theme.muted, fontSize: 12, fontVariant: ['tabular-nums'] }}>{levelText(session.mixer.displayValue(item.channel), mix.parameter)}</Text>}
    </View>
    <Fader channel={item.channel} label={item.label} color={theme.tint} vertical={landscape} length={stripHeight} />
  </View>;
  return <Page title="Mixer" scroll={false} compactHeader hideHeader={landscape} toolbar={<MixerToolbar />}>
    {!state.server ? <EmptyMixer /> : <FlatList key={landscape ? 'strips' : 'rows'} horizontal={landscape} onLayout={event => setBankHeight(event.nativeEvent.layout.height)} extraData={state.preferences}
      data={channels} renderItem={renderChannel} keyExtractor={item => String(item.channel)} contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: topPadding, paddingLeft: landscape ? insets.left + 20 : 20, paddingRight: landscape ? insets.right + 20 : 20, paddingBottom: bottomPadding }} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={!landscape ? <View style={{ gap: 17, marginBottom: 20 }}>
        <Segmented label="Fader mode" value={mix.parameter} options={[{ value: 'level', label: 'Level' }, { value: 'pan', label: 'Pan' }]} onChange={value => session.mixer.setParameter(value === 'pan' ? 'pan' : 'level')} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ color: theme.muted, fontSize: 13, marginLeft: 'auto' }}>{channels.length} channels</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit channel order" onPress={() => router.push('/layout')} style={{ minHeight: 40, justifyContent: 'center', paddingLeft: 4 }}>
            <Text style={{ color: theme.tint, fontSize: 15 }}>Edit</Text>
          </Pressable>
        </View>
      </View> : undefined}
      ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
        <Icon name={{ ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }} size={34} color={theme.muted} />
        <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>{hidden.length ? 'All channels hidden' : 'No channels'}</Text>
        <Text style={{ color: theme.muted, textAlign: 'center', lineHeight: 22 }}>{hidden.length ? 'Use Edit to show channels.' : 'Check the server’s desk connection.'}</Text>
        {hidden.length > 0 && <NativeButton title="Edit channels" onPress={() => router.push('/layout')} />}
      </View>} />}
  </Page>;
}
