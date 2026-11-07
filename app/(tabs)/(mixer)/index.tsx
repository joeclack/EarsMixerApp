import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '../../../src/mixer/context';
import { useTheme } from '../../../src/theme';
import { orderedChannels, levelText, type Channel } from '../../../src/mixer/model';
import { Page, EmptyMixer, Icon, Message } from '../../../src/components/ui';
import NativeButton from '../../../src/components/NativeButton';
import Segmented from '../../../src/components/Segmented';
import Fader from '../../../src/components/Fader';
import MixerToolbar from '../../../src/components/MixerToolbar';

export default function Mixer() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  useFocusEffect(useCallback(() => () => session.mixer.cancelWrites(), [session]));
  const favourites = state.preferences.favouritesByAux[String(mix.aux)] || { channels: [], enabled: false };
  const channels = useMemo(() => orderedChannels(mix.config, state.preferences).filter(c => !favourites.enabled || favourites.channels.includes(c.channel)), [mix.config, state.preferences, favourites.enabled]);
  const loaded = Object.keys(mix.values).length, count = mix.config?.channels.length || 0;
  const compact = state.preferences.compact;
  const toggleFavourite = (channel: number) => {
    if (!mix.aux) return;
    const next = favourites.channels.includes(channel) ? favourites.channels.filter(id => id !== channel) : [...favourites.channels, channel];
    session.preferences({ favouritesByAux: { ...state.preferences.favouritesByAux, [mix.aux]: { ...favourites, channels: next } } });
  };
  const renderChannel = ({ item }: { item: Channel }) => <View testID={'channel-' + item.channel} style={{ paddingHorizontal: compact ? 12 : 17, paddingVertical: compact ? 6 : 17, borderRadius: compact ? 14 : 20, backgroundColor: theme.panel, marginBottom: compact ? 6 : 10 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ color: theme.muted, fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 20 }}>{String(item.channel).padStart(2, '0')}</Text>
      <Text numberOfLines={compact ? 1 : 2} style={{ color: theme.text, fontSize: compact ? 15 : 17, fontWeight: '600', flex: 1 }}>{item.label}</Text>
      {compact && <Text style={{ color: theme.muted, fontSize: 12, fontVariant: ['tabular-nums'] }}>{levelText(mix.values[item.channel], mix.parameter)}</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel={(favourites.channels.includes(item.channel) ? 'Remove favourite ' : 'Favourite ') + item.label}
        accessibilityState={{ selected: favourites.channels.includes(item.channel) }} onPress={() => toggleFavourite(item.channel)} hitSlop={10}
        style={{ minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={{ ios: favourites.channels.includes(item.channel) ? 'star.fill' : 'star', android: favourites.channels.includes(item.channel) ? 'star' : 'star_outline', web: 'star' }}
          size={20} color={favourites.channels.includes(item.channel) ? theme.orange : theme.muted} />
      </Pressable>
    </View>
    <Fader channel={item.channel} label={item.label} color={theme.tint} />
    {!compact && <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {!compact && <Text style={{ color: theme.muted, fontSize: 11 }}>{mix.parameter === 'level' ? 'SEND LEVEL' : 'SEND PAN'}</Text>}
      <Text style={{ color: theme.text, marginLeft: 'auto', fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'] }}>{levelText(mix.values[item.channel], mix.parameter)}</Text>
    </View>}
  </View>;
  return <Page title="Mixer" scroll={false} compactHeader toolbar={<MixerToolbar />}>
    {!state.server ? <EmptyMixer /> : <FlatList extraData={state.preferences}
      data={channels} renderItem={renderChannel} keyExtractor={item => String(item.channel)} contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, paddingBottom: 130 }} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={{ gap: 17, marginBottom: 20 }}>
        {mix.status === 'connected' && loaded < count && <Text style={{ color: theme.muted, fontSize: 13 }}>Loading channels · {loaded}/{count}</Text>}
        {!!mix.config?.snapshot && <Text numberOfLines={1} style={{ color: theme.muted, fontSize: 12 }}>{mix.config.snapshot}</Text>}
        <Segmented label="Fader mode" value={mix.parameter} options={[{ value: 'level', label: 'Level' }, { value: 'pan', label: 'Pan' }]} onChange={value => session.mixer.setParameter(value === 'pan' ? 'pan' : 'level')} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: favourites.enabled }} onPress={() => {
            if (mix.aux) session.preferences({ favouritesByAux: { ...state.preferences.favouritesByAux, [mix.aux]: { ...favourites, enabled: !favourites.enabled } } });
          }} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 40 }}>
            <Icon name={{ ios: favourites.enabled ? 'star.fill' : 'star', android: 'star', web: 'star' }} size={17} color={favourites.enabled ? theme.orange : theme.muted} />
            <Text style={{ color: favourites.enabled ? theme.orange : theme.muted, fontSize: 14, fontWeight: '600' }}>Favourites</Text>
          </Pressable>
          <Text style={{ color: theme.muted, fontSize: 13, marginLeft: 'auto' }}>{channels.length} channels</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit channel order" onPress={() => router.push('/layout')} style={{ minHeight: 40, justifyContent: 'center', paddingLeft: 4 }}>
            <Text style={{ color: theme.tint, fontSize: 15 }}>Edit</Text>
          </Pressable>
        </View>
        {state.sync === 'conflict' && <Message>Your layout changed on another device. Resolve it in Profile.</Message>}
      </View>}
      ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
        <Icon name={{ ios: favourites.enabled ? 'star' : 'waveform', android: 'tune', web: 'tune' }} size={34} color={theme.muted} />
        <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>{favourites.enabled ? 'No favourites' : 'No channels'}</Text>
        <Text style={{ color: theme.muted, textAlign: 'center', lineHeight: 22 }}>{favourites.enabled ? 'Star a channel to add it here.' : 'Check the server’s desk connection.'}</Text>
        {favourites.enabled && <NativeButton title="Show all channels" onPress={() => {
          if (mix.aux) session.preferences({ favouritesByAux: { ...state.preferences.favouritesByAux, [mix.aux]: { ...favourites, enabled: false } } });
        }} />}
      </View>} />}
  </Page>;
}
