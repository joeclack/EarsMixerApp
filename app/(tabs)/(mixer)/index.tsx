import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '../../../src/mixer/context';
import { useTheme } from '../../../src/theme';
import { orderedChannels, levelText, type Channel } from '../../../src/mixer/model';
import { Page, EmptyMixer, Glass, Icon, Message } from '../../../src/components/ui';
import NativeButton from '../../../src/components/NativeButton';
import Segmented from '../../../src/components/Segmented';
import Fader from '../../../src/components/Fader';

export default function Mixer() {
  const { session, state, mix } = useSession();
  const theme = useTheme(), { width } = useWindowDimensions();
  useFocusEffect(useCallback(() => () => session.mixer.cancelWrites(), [session]));
  const aux = mix.config?.aux.find(a => a.channel === mix.aux);
  const favourites = state.preferences.favouritesByAux[String(mix.aux)] || { channels: [], enabled: false };
  const channels = useMemo(() => orderedChannels(mix.config, state.preferences).filter(c => !favourites.enabled || favourites.channels.includes(c.channel)), [mix.config, state.preferences, favourites.enabled]);
  const loaded = Object.keys(mix.values).length, count = mix.config?.channels.length || 0;
  const columns = state.preferences.view === 'grid' && width >= 700 ? (width >= 1100 ? 3 : 2) : 1;
  const toggleFavourite = (channel: number) => {
    if (!mix.aux) return;
    const next = favourites.channels.includes(channel) ? favourites.channels.filter(id => id !== channel) : [...favourites.channels, channel];
    session.preferences({ favouritesByAux: { ...state.preferences.favouritesByAux, [mix.aux]: { ...favourites, channels: next } } });
  };
  const renderChannel = ({ item }: { item: Channel }) => <View style={{ flex: 1, maxWidth: columns > 1 ? (width - 40 - (columns - 1) * 12) / columns : undefined,
    padding: state.preferences.compact ? 12 : 17, borderRadius: 20, backgroundColor: theme.panel, marginBottom: 10 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ color: theme.muted, fontSize: 12, fontVariant: ['tabular-nums'], minWidth: 20 }}>{String(item.channel).padStart(2, '0')}</Text>
      <Text numberOfLines={2} style={{ color: theme.text, fontSize: 17, fontWeight: '600', flex: 1 }}>{item.label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={(favourites.channels.includes(item.channel) ? 'Remove favourite ' : 'Favourite ') + item.label}
        accessibilityState={{ selected: favourites.channels.includes(item.channel) }} onPress={() => toggleFavourite(item.channel)} hitSlop={10}
        style={{ minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={{ ios: favourites.channels.includes(item.channel) ? 'star.fill' : 'star', android: favourites.channels.includes(item.channel) ? 'star' : 'star_outline', web: 'star' }}
          size={20} color={favourites.channels.includes(item.channel) ? theme.orange : theme.muted} />
      </Pressable>
    </View>
    <Fader channel={item.channel} label={item.label} color={theme.tint} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {!state.preferences.compact && <Text style={{ color: theme.muted, fontSize: 11 }}>{mix.parameter === 'level' ? 'SEND LEVEL' : 'SEND PAN'}</Text>}
      <Text style={{ color: theme.text, marginLeft: 'auto', fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'] }}>{levelText(mix.values[item.channel], mix.parameter)}</Text>
    </View>
  </View>;
  return <Page title="Mixer" scroll={false}>
    {!state.server ? <EmptyMixer /> : <FlatList key={columns} numColumns={columns} columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
      data={channels} renderItem={renderChannel} keyExtractor={item => String(item.channel)} contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, paddingBottom: 130 }} keyboardShouldPersistTaps="handled"
      ListHeaderComponent={<View style={{ gap: 17, marginBottom: 20 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose your mix" onPress={() => router.push('/mixes')}>
          <Glass style={{ borderRadius: 26, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <Icon name={{ ios: 'headphones', android: 'headphones', web: 'headphones' }} size={30} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: theme.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>YOUR MIX</Text>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 23 }}>{aux?.label || (mix.status === 'connected' ? 'No mixes enabled' : 'Connecting…')}</Text>
            </View>
            <Icon name={{ ios: 'chevron.up.chevron.down', android: 'unfold_more', web: 'unfold_more' }} size={16} color={theme.muted} />
          </Glass>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: mix.status === 'connected' ? theme.green : theme.orange }} />
          <Text style={{ color: theme.muted, fontSize: 13, flex: 1 }}>
            {mix.status !== 'connected' ? 'Reconnecting to your mixer…' : loaded < count ? 'Loading channels · ' + loaded + '/' + count : 'Connected · ' + new URL(state.server).host}
          </Text>
          {!!mix.config?.snapshot && <Text numberOfLines={1} style={{ color: theme.muted, fontSize: 12, maxWidth: '40%' }}>{mix.config.snapshot}</Text>}
        </View>
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
        <Text style={{ color: theme.text, fontSize: 19, fontWeight: '600' }}>{favourites.enabled ? 'Your favourites go here' : 'Waiting for your channels'}</Text>
        <Text style={{ color: theme.muted, textAlign: 'center', lineHeight: 22 }}>{favourites.enabled ? 'Show all channels, then star the ones you use most.' : 'Channels appear when the server is connected to the desk.'}</Text>
        {favourites.enabled && <NativeButton title="Show all channels" onPress={() => {
          if (mix.aux) session.preferences({ favouritesByAux: { ...state.preferences.favouritesByAux, [mix.aux]: { ...favourites, enabled: false } } });
        }} />}
      </View>} />}
  </Page>;
}
