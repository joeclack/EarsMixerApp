import React, { useState, useSyncExternalStore } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import ScreenSurface from '../src/components/ScreenSurface';
import HardwarePanel from '../src/components/HardwarePanel';
import NativeButton from '../src/components/NativeButton';
import { Icon } from '../src/components/ui';
import { useTheme } from '../src/theme';
import { useSession } from '../src/mixer/context';
import { REQUEST_KINDS, type RequestKind } from '../src/mixer/client';

// Ask the engineer for something without catching their eye. One tap sends a
// quick request; a short message can go with it or on its own.
export default function Request() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const mixer = session.mixer;
  const sent = useSyncExternalStore(mixer.subscribeRequests, mixer.requestsSnapshot, mixer.requestsSnapshot);
  const rejected = useSyncExternalStore(mixer.subscribeRequests, () => mixer.requestRejected(), () => mixer.requestRejected());
  const [text, setText] = useState('');
  const connected = mix.status === 'connected';
  const send = (kind: RequestKind | null) => {
    if (!mixer.sendRequest(kind, text)) return;
    Keyboard.dismiss();
    setText('');
    if (state.settings.haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };
  return <ScreenSurface><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
    contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: insets.bottom + 24 }}>
    <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>Message the engineer</Text>
    <Text style={{ color: theme.muted, fontSize: 15, marginTop: 6, marginBottom: 20, lineHeight: 21 }}>
      {connected ? 'Requests appear on the engineer’s dashboard with your name and mix.' : 'Connect to the mixer to send a request.'}
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {REQUEST_KINDS.map(entry => <Pressable key={entry.kind} accessibilityRole="button" disabled={!connected}
        accessibilityLabel={'Send ' + entry.label + (text.trim() ? ' with your message' : '')} onPress={() => send(entry.kind)}
        style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center',
          backgroundColor: theme.secondary, opacity: !connected ? 0.5 : pressed ? 0.7 : 1 })}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>{entry.label}</Text>
      </Pressable>)}
    </View>
    <HardwarePanel radius={18} style={{ paddingHorizontal: 16, marginTop: 20 }}>
      <TextInput accessibilityLabel="Message" value={text} onChangeText={setText} maxLength={140} editable={connected}
        placeholder="Add a short message (optional)" placeholderTextColor={theme.muted} returnKeyType="send"
        onSubmitEditing={() => send(null)} style={{ color: theme.text, fontSize: 17, minHeight: 52, paddingVertical: 12 }} />
    </HardwarePanel>
    <View style={{ marginTop: 12 }}>
      <NativeButton title="Send message" prominent fullWidth disabled={!connected || !text.trim()} onPress={() => send(null)} />
    </View>
    {rejected && <Text accessibilityLiveRegion="polite" style={{ color: theme.orange, fontSize: 14, marginTop: 12 }}>
      Too many requests close together. Wait a moment and try again.</Text>}
    {sent.length > 0 && <View style={{ marginTop: 28, gap: 10 }}>
      <Text accessibilityRole="header" style={{ color: theme.muted, fontSize: 13, fontWeight: '600' }}>Sent</Text>
      {sent.map(entry => <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ flex: 1, color: theme.text, fontSize: 15 }} numberOfLines={2}>
          {(REQUEST_KINDS.find(kind => kind.kind === entry.kind)?.label || 'Message') + (entry.text ? ' — ' + entry.text : '')}</Text>
        {entry.acknowledged
          ? <View accessible accessibilityLabel="Seen by the engineer" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} size={16} color={theme.green} />
            <Text style={{ color: theme.green, fontSize: 13, fontWeight: '600' }}>Seen</Text></View>
          : <Text style={{ color: theme.muted, fontSize: 13 }}>Sent</Text>}
      </View>)}
    </View>}
  </ScrollView></ScreenSurface>;
}
