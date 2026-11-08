import { Pressable, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSession } from '../mixer/context';
import { useTheme } from '../theme';
import { Icon, styles } from './ui';

export default function MixerToolbar() {
  const { session, state, mix } = useSession();
  const theme = useTheme();
  return <Stack.Screen options={{ headerRight: () => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={(mix.status === 'connected' ? 'Connected' : 'Disconnected') + '. Connect to mixer'}
      onPress={() => router.push('/connect')} style={styles.headerButton}>
      <Icon name={{ web: mix.status === 'connected' ? 'wifi' : 'wifi_off' }} color={mix.status === 'connected' ? theme.green : theme.danger} />
    </Pressable>
    {state.server && !!mix.config?.aux.length && <details style={{ position: 'relative', color: theme.tint }}>
      <summary aria-label="Choose AUX" style={{ cursor: 'pointer', padding: 10, listStyle: 'none' }}><Icon name={{ web: 'headphones' }} /></summary>
      <div style={{ position: 'absolute', right: 0, top: '100%', minWidth: 180, padding: 12, background: theme.panel, borderRadius: 12, zIndex: 100, display: 'grid', gap: 8 }}>
        {mix.config.aux.map(aux => <button key={aux.channel} disabled={mix.status !== 'connected'} aria-pressed={mix.aux === aux.channel}
          onClick={event => { session.preferences({ selectedAux: aux.channel }); event.currentTarget.closest('details')?.removeAttribute('open'); }}>{aux.label}</button>)}
      </div>
    </details>}
    {state.server && <details style={{ position: 'relative', color: theme.tint }}>
      <summary aria-label="Mixer options" style={{ cursor: 'pointer', padding: 12, fontSize: 22, listStyle: 'none' }}>…</summary>
      <div style={{ position: 'absolute', right: 0, top: '100%', minWidth: 220, padding: 12, background: theme.panel, border: '1px solid ' + theme.line, borderRadius: 12, zIndex: 100, display: 'grid', gap: 12 }}>

        <button onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); router.push('/templates'); }}>Templates</button>
        <button onClick={event => { event.currentTarget.closest('details')?.removeAttribute('open'); router.push('/layout'); }}>Edit channels</button>
      </div>
    </details>}

    <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={styles.headerButton}>
      <Icon name={{ web: 'settings' }} />
    </Pressable>
  </View> }} />;
}
