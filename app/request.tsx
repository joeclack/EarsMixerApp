import React, { useState, useSyncExternalStore } from 'react';
import { Keyboard, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import ScreenSurface from '../src/components/ScreenSurface';
import HardwarePanel from '../src/components/HardwarePanel';
import NativeButton from '../src/components/NativeButton';
import { Icon } from '../src/components/ui';
import { useTheme } from '../src/theme';
import { useSession } from '../src/mixer/context';

// Send the engineer a short message without catching their eye.
export default function Request() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const mixer = session.mixer;
  const sent = useSyncExternalStore(mixer.subscribeRequests, mixer.requestsSnapshot, mixer.requestsSnapshot);
  const rejected = useSyncExternalStore(mixer.subscribeRequests, () => mixer.requestRejected(), () => mixer.requestRejected());
  const [text, setText] = useState('');
  const connected = mix.status === 'connected';
  const send = () => {
    if (!mixer.sendRequest(null, text)) return;
    Keyboard.dismiss();
    setText('');
    if (state.settings.haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };
  return <ScreenSurface><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
    contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: insets.bottom + 24 }}>
    <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 }}>Message the engineer</Text>
    <Text style={{ color: theme.muted, fontSize: 15, marginTop: 6, marginBottom: 20, lineHeight: 21 }}>
      {connected ? 'Your message appears on the engineer’s dashboard with your name and mix.' : 'Connect to the mixer to send a message.'}
    </Text>
    <HardwarePanel radius={18} style={{ paddingHorizontal: 16 }}>
      <TextInput accessibilityLabel="Message" value={text} onChangeText={setText} maxLength={140} editable={connected} autoFocus={connected}
        placeholder="e.g. More click please" placeholderTextColor={theme.muted} returnKeyType="send" multiline submitBehavior="submit"
        onSubmitEditing={send} style={{ color: theme.text, fontSize: 17, minHeight: 52, paddingVertical: 14 }} />
    </HardwarePanel>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
      <Text style={{ color: theme.muted, fontSize: 12 }}>{text.length}/140</Text>
    </View>
    <View style={{ marginTop: 8 }}>
      <NativeButton title="Send" prominent fullWidth disabled={!connected || !text.trim()} onPress={send} />
    </View>
    {rejected && <Text accessibilityLiveRegion="polite" style={{ color: theme.orange, fontSize: 14, marginTop: 12 }}>
      Too many messages close together. Wait a moment and try again.</Text>}
    {sent.length > 0 && <View style={{ marginTop: 28, gap: 10 }}>
      <Text accessibilityRole="header" style={{ color: theme.muted, fontSize: 13, fontWeight: '600' }}>Sent</Text>
      {sent.map(entry => <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ flex: 1, color: theme.text, fontSize: 15 }} numberOfLines={3}>{entry.text}</Text>
        {entry.acknowledged
          ? <View accessible accessibilityLabel="Seen by the engineer" style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} size={16} color={theme.green} />
            <Text style={{ color: theme.green, fontSize: 13, fontWeight: '600' }}>Seen</Text></View>
          : <Text style={{ color: theme.muted, fontSize: 13 }}>Sent</Text>}
      </View>)}
    </View>}
  </ScrollView></ScreenSurface>;
}
