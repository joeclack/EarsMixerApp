import { Host, SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, semantics } from '@expo/ui/jetpack-compose/modifiers';
import { useTheme } from '../theme';
import type { SegmentProps } from './Segmented';

export default function Segmented({ value, options, onChange, label }: SegmentProps) {
  const theme = useTheme();
  return <Host matchContents={{ vertical: true }} style={{ alignSelf: 'stretch' }} colorScheme={theme.scheme} seedColor={theme.tint}>
    <SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth(), semantics({ contentDescription: label })]}>
      {options.map(option => <SegmentedButton key={option.value} selected={value === option.value} onClick={() => onChange(option.value)}>
        <SegmentedButton.Label><Text>{option.label}</Text></SegmentedButton.Label>
      </SegmentedButton>)}
    </SingleChoiceSegmentedButtonRow>
  </Host>;
}
