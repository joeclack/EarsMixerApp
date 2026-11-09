import { Platform } from 'react-native';
import { Page } from '../src/components/ui';
import GroupEditor from '../src/components/GroupEditor';
export default function Groups() { return <Page title="Channel groups" scroll={Platform.OS !== 'ios'}><GroupEditor /></Page>; }
