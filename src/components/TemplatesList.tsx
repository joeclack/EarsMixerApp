import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import type { MixerTemplate } from '../mixer/templates';
import NativeButton from './NativeButton';
import { Icon, Message } from './ui';

// The mixer's shared templates, used by the Channels tab and the setup sheet.
export default function TemplatesList({ onApplied }: { onApplied?(): void }) {
  const { session, state } = useSession(), theme = useTheme();
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
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
  return <>
    <Text style={{ color: theme.muted, fontSize: 15, marginBottom: 20 }}>Choose a layout. Desk levels stay unchanged.</Text>
    {loading && <ActivityIndicator color={theme.tint} />}
    {!loading && !error && !templates.length && <Message>No templates available on this mixer.</Message>}
    <View>
      {templates.map(template => <View key={template.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 60, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.line }}>
        <Text accessibilityLabel={template.name + (state.selectedTemplate?.id === template.id ? ', selected' : '')} style={{ flex: 1, color: theme.text, fontSize: 17 }}>{template.name}</Text>
        {state.selectedTemplate?.id === template.id && <Animated.View entering={FadeIn.duration(140).reduceMotion(ReduceMotion.System)} pointerEvents="none" accessible={false}>
          <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={16} />
        </Animated.View>}
        <NativeButton title="Select" disabled={applying || loading} onPress={() => {
          setApplying(true); setError('');
          void session.applyTemplate(template.id).then(() => { if (alive.current) onApplied?.(); })
            .catch(error => { if (alive.current) setError(error instanceof Error ? error.message : 'Could not load this template.'); })
            .finally(() => { if (alive.current) setApplying(false); });
        }} />
      </View>)}
    </View>
    <Message error>{error}</Message>
    {!!error && <NativeButton title="Retry" disabled={applying} onPress={() => setRetry(value => value + 1)} />}
  </>;
}
