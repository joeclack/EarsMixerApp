import { Platform } from 'react-native';
import { Page } from '../src/components/ui';
import GroupsList from '../src/components/GroupsList';
export default function Groups() { return <Page title="Channel groups" scroll={Platform.OS !== 'ios'}><GroupsList /></Page>; }
