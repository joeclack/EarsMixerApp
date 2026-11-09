import React from 'react';
import { Host } from '@expo/ui';
import { Form, Text, Button, HStack, VStack, Spacer, Image } from '@expo/ui/swift-ui';
import { accessibilityLabel, buttonStyle, disabled, foregroundStyle, scrollContentBackground } from '@expo/ui/swift-ui/modifiers';
import Section from './HardwareSection.ios';
import { useTheme } from '../theme';
import { useGroupEditor } from './useGroupEditor';

// A single native scrolling form owns both rows and controls. Separate SwiftUI
// hosts inside RN scroll rows can draw beyond their measured row during scrolling.
export default function GroupEditor() {
  const editor = useGroupEditor(), theme = useTheme();
  return <Host style={{ flex: 1 }} colorScheme={theme.scheme} seedColor={theme.tint}>
    <Form modifiers={[scrollContentBackground('hidden')]}>
      <Section footer="One fader keeps the level balance. Hold its name or display to adjust the channels; pan stays individual.">
        <Button label={'Group selected (' + editor.selected.length + ')'} systemImage="link" onPress={editor.create}
          modifiers={[disabled(!editor.canCreate)]} />
        {!!editor.error && <Text modifiers={[foregroundStyle(theme.danger)]}>{editor.error}</Text>}
      </Section>
      {!!editor.groups.length && <Section title="Your groups" symbol="link" footer="Ungrouping changes the layout only. Desk levels stay unchanged.">
        {editor.groups.map(group => <HStack key={group[0]} spacing={12}>
          <VStack alignment="leading" spacing={4}>
            <Text modifiers={[foregroundStyle(theme.text)]}>{editor.label(group)}</Text>
            <Text modifiers={[foregroundStyle(theme.muted)]}>{group.length + ' linked channels'}</Text>
          </VStack>
          <Spacer />
          <Button label="Ungroup" onPress={() => editor.remove(group)} modifiers={[buttonStyle('borderless'), accessibilityLabel('Ungroup ' + editor.label(group))]} />
        </HStack>)}
      </Section>}
      <Section title="Select channels" symbol="slider.horizontal.3" footer="Choose at least two channels. Each channel can belong to one group per AUX. Grouping also shows selected hidden channels.">
        {editor.available.map(channel => {
          const selected = editor.selected.includes(channel.channel);
          return <Button key={channel.channel} onPress={() => editor.toggle(channel.channel)}
            modifiers={[accessibilityLabel((selected ? 'Deselect ' : 'Select ') + channel.label)]}>
            <HStack spacing={12}>
              <Text modifiers={[foregroundStyle(theme.text)]}>{channel.label}</Text>
              <Spacer />
              <Image systemName={selected ? 'checkmark.circle.fill' : 'circle'} color={theme.tint} size={22} />
            </HStack>
          </Button>;
        })}
        {!editor.available.length && <Text modifiers={[foregroundStyle(theme.muted)]}>{editor.channels.length ? 'All channels are grouped.' : 'Connect to a mixer first.'}</Text>}
      </Section>
    </Form>
  </Host>;
}
