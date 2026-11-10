import { Host, Switch } from '@expo/ui';
import { useTheme } from '../theme';

export type GroupScopeSwitchProps = { value: boolean; disabled: boolean; onChange(value: boolean): void };
export default function GroupScopeSwitch({ value, disabled, onChange }: GroupScopeSwitchProps) {
  const theme = useTheme();
  return <Host matchContents={{ vertical: true }} colorScheme={theme.scheme} seedColor={theme.tint} style={{ minHeight: 56 }}>
    <Switch label="All monitor mixes" value={value} onValueChange={onChange} disabled={disabled} />
  </Host>;
}
