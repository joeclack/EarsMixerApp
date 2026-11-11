import { Message } from './ui';
import { useTheme } from '../theme';
import { groupChannelNames, groupLabel } from '../mixer/groups';
import { useGroupsList } from './useGroupsList';
import { MaterialIconButton, MaterialItem, MaterialSection } from './MaterialList.android';

// Native Material rows mirroring the iOS groups list, with delete as a trailing action.
export default function GroupsList() {
  const list = useGroupsList(), theme = useTheme();
  return <>
    <Message error>{list.error}</Message>
    <MaterialSection title="Your groups" symbol="link">
      <MaterialItem title="Create new group" symbol="add_circle" tint disabled={!list.canCreate} onPress={() => list.open('new')} />
      {list.groups.map(group => {
        const title = groupLabel(group, list.channels);
        const detail = (group.allAuxes ? 'All monitor mixes' : 'This monitor mix') + ' · ' + group.members.length + ' channels'
          + (group.name ? ' · ' + groupChannelNames(group, list.channels) : '');
        return <MaterialItem key={group.id} title={title} detail={detail} onPress={() => list.open(group.id)} disabled={list.busy}
          trailing={<MaterialIconButton symbol="delete" label={'Delete ' + title} color={theme.danger} disabled={list.busy} onPress={() => list.remove([group.id])} />} />;
      })}
      {!list.groups.length && <MaterialItem title="No channel groups yet" detail="Group channels to move them together with one fader." />}
    </MaterialSection>
  </>;
}
