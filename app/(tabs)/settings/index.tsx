import { Platform } from 'react-native';
import { Page } from '../../../src/components/ui';
import SettingsContent from '../../../src/components/SettingsContent';
export default function Settings() { return <Page title="Settings" scroll={Platform.OS !== 'ios'}><SettingsContent /></Page>; }
