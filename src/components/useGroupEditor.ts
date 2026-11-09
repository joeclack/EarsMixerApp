import { useEffect, useState } from 'react';
import { useSession } from '../mixer/context';
import { orderedChannels } from '../mixer/model';

export function useGroupEditor() {
  const { session, state, mix } = useSession();
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { setSelected([]); setError(''); }, [state.server, mix.aux]);
  const channels = orderedChannels(mix.config, state.preferences);
  const groups = state.preferences.groupsByAux[String(mix.aux)] || [];
  const label = (members: number[]) => members.map(id => channels.find(c => c.channel === id)?.label || 'Channel ' + id).join(' / ');
  const available = channels.filter(channel => !groups.some(group => group.includes(channel.channel)));
  const toggle = (channel: number) => setSelected(ids => ids.includes(channel) ? ids.filter(id => id !== channel) : [...ids, channel]);
  const remove = (group: number[]) => { session.removeGroup(group[0]); setSelected([]); };
  const create = () => {
    if (session.createGroup(selected)) { setSelected([]); setError(''); session.notifySuccess('Channel group created'); }
    else { setSelected([]); setError('The available channels changed. Select them again.'); }
  };
  return { selected, error, channels, groups, label, available, toggle, remove, create, canCreate: !!mix.aux && selected.length >= 2 };
}
