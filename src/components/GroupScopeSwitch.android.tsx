import { Host } from '@expo/ui';
import { Row, Switch, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, semantics, weight } from '@expo/ui/jetpack-compose/modifiers';
import { useTheme } from '../theme';
import type { GroupScopeSwitchProps } from './GroupScopeSwitch';

export default function GroupScopeSwitch({ value, disabled, onChange }: GroupScopeSwitchProps) {
  const theme = useTheme();
  return <Host matchContents={{ vertical: true }} colorScheme={theme.scheme} seedColor={theme.tint} style={{ minHeight: 56 }}>
    <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
      <Text color={disabled ? theme.muted : theme.text} modifiers={[weight(1)]}>All monitor mixes</Text>
      <Switch value={value} enabled={!disabled} onCheckedChange={onChange} modifiers={[semantics({ contentDescription: 'All monitor mixes' })]} />
    </Row>
  </Host>;
}
