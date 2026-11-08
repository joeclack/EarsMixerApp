import ScreenSurface from '../src/components/ScreenSurface';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../src/mixer/context';
import { useTheme } from '../src/theme';
import type { MixerTemplate } from '../src/mixer/templates';
import NativeButton from '../src/components/NativeButton';
import CloseButton from '../src/components/CloseButton';
import { Message } from '../src/components/ui';
export default function Templates() {
  const { session, state } = useSession(), theme = useTheme(), insets = useSafeAreaInsets();
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const [templates, setTemplates] = useState<MixerTemplate[]>([]);
  const [loading, setLoading] = useState(true), [applying, setApplying] = useState(false);
  const [error, setError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setTemplates([]);
    void session.templates(controller.signal).then(value => { if (!controller.signal.aborted) setTemplates(value); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load templates.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session, state.server, retry]);
  return <ScreenSurface><ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: insets.bottom + 24 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: '700' }}>Templates</Text>
      <CloseButton onPress={() => router.back()} />
    </View>
    <Text style={{ color: theme.muted, fontSize: 15, marginBottom: 20 }}>Choose a layout. Desk levels stay unchanged.</Text>
    {loading && <ActivityIndicator color={theme.tint} />}
    {!loading && !error && !templates.length && <Message>No templates available on this mixer.</Message>}
    <View>
      {templates.map(template => <View key={template.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 60, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.line }}>
        <Text style={{ flex: 1, color: theme.text, fontSize: 17 }}>{template.name}</Text>
        <NativeButton title="Select" disabled={applying || loading} onPress={() => {
        setApplying(true); setError('');
        void session.applyTemplate(template.id).then(() => { if (alive.current) router.back(); })
          .catch(error => { if (alive.current) setError(error instanceof Error ? error.message : 'Could not load this template.'); })
          .finally(() => { if (alive.current) setApplying(false); });
      }} />
      </View>)}
    </View>
    <Message error>{error}</Message>
    {!!error && <NativeButton title="Retry" disabled={applying} onPress={() => setRetry(value => value + 1)} />}
  </ScrollView></ScreenSurface>;
}
