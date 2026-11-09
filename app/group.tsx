import { Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Page, Message } from '../src/components/ui';
import NativeButton from '../src/components/NativeButton';
import GroupEditor from '../src/components/GroupEditor';
import { closeGroupEditor } from '../src/components/useGroupEditor';

export default function Group() {
  const params = useLocalSearchParams<{ id?: string; server?: string; aux?: string }>();
  const creating = params.id === 'new';
  const id = creating ? null : Number(params.id);
  const aux = Number(params.aux);
  if (typeof params.id !== 'string' || typeof params.aux !== 'string' || typeof params.server !== 'string' || !params.server || !Number.isSafeInteger(aux) || aux <= 0 ||
    (!creating && (!Number.isSafeInteger(id) || Number(id) <= 0))) return <Page title="Group">
      <Message error>Open a group from Channel groups.</Message><NativeButton title="Channel groups" onPress={closeGroupEditor} />
    </Page>;
  return <Page title={creating ? 'New group' : 'Edit group'} scroll={Platform.OS !== 'ios'}>
    <GroupEditor key={params.server + ':' + aux + ':' + params.id} groupId={id} scope={{ server: params.server, aux }} />
  </Page>;
}
