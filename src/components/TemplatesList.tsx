import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import type { MixerTemplate } from '../mixer/templates';
import NativeButton from './NativeButton';
import { Icon, Message } from './ui';

// The mixer's shared templates, used by the Channels tab and setup's template step.
export default function TemplatesList({ onApplied, intro = true }: { onApplied?(): void; intro?: boolean }) {
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
  const replacement = 'Applying a layout replaces channel order, visibility and groups. Desk levels stay unchanged.';
  const apply = (template: MixerTemplate) => {
    setApplying(true); setError('');
    void session.applyTemplate(template.id).then(() => { if (alive.current) onApplied?.(); })
      .catch(error => { if (alive.current) setError(error instanceof Error ? error.message : 'Could not load this template.'); })
      .finally(() => { if (alive.current) setApplying(false); });
  };
  const reapply = (template: MixerTemplate) => {
    const title = 'Reapply layout?';
    if (Platform.OS === 'web') {
      if (window.confirm(title + '\n\n' + replacement)) apply(template);
      return;
    }
    Alert.alert(title, replacement, [{ text: 'Cancel', style: 'cancel' }, { text: 'Reapply layout', onPress: () => apply(template) }]);
  };
  return <>
    {intro && <Text style={{ color: theme.muted, fontSize: 15, lineHeight: 21, marginBottom: 12 }}>{replacement}</Text>}
    {loading && <ActivityIndicator color={theme.tint} />}
    {!loading && !error && !templates.length && <Message>No templates available on this mixer.</Message>}
    <View>
      {templates.map(template => {
        const applied = state.selectedTemplate?.id === template.id;
        return <View key={template.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60,
          paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.line }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: theme.text, fontSize: 17 }}>{template.name}</Text>
            {applied && <Animated.View entering={FadeIn.duration(140).reduceMotion(ReduceMotion.System)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={13} />
              <Text style={{ color: theme.tint, fontSize: 13 }}>Applied</Text>
            </Animated.View>}
          </View>
          <NativeButton title={applied ? 'Reapply layout' : 'Apply layout'}
            accessibilityLabel={(applied ? 'Reapply ' : 'Apply ') + template.name}
            disabled={applying || loading} onPress={() => applied ? reapply(template) : apply(template)} />
        </View>;
      })}
    </View>
    <Message error>{error}</Message>
    {!!error && <NativeButton title="Retry" disabled={applying} onPress={() => setRetry(value => value + 1)} />}
    {/* Taking a template off puts the mixer's normal layout back. It also undoes any
        changes made since, so it asks first. */}
    {!!state.selectedTemplate && <View style={{ marginTop: 20, alignItems: 'flex-start' }}>
      <NativeButton title="Remove template" destructive disabled={applying} onPress={() => {
        const title = 'Remove template?';
        const message = 'Your channels go back to the normal order, every channel is shown again and groups are removed. Your mix and its levels stay the same.';
        if (Platform.OS === 'web') { if (window.confirm(title + '\n\n' + message)) session.removeTemplate(); return; }
        Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => session.removeTemplate() }]);
      }} />
    </View>}
  </>;
}
