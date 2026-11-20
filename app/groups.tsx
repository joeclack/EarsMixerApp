import { Redirect } from 'expo-router';
// Channel groups live in the Channels tab, under Groups.
export default function Groups() { return <Redirect href={{ pathname: '/channels', params: { tab: 'groups' } }} />; }
