import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useSession } from '../mixer/context';
import { orderedChannels } from '../mixer/model';

export function useGroupsList() {
  const { session, state, mix } = useSession();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useEffect(() => { setSelecting(false); setSelected([]); setError(''); }, [state.server, mix.aux]);
  const groups = mix.aux === null ? [] : [...state.preferences.globalGroups.map(group => ({ ...group, allAuxes: true })),
    ...(state.preferences.groupsByAux[String(mix.aux)] || []).map(group => ({ ...group, allAuxes: false }))];
  const channels = orderedChannels(mix.config, state.preferences);
  const scope = state.server && mix.aux ? { server: state.server, aux: mix.aux } : null;
  const chosen = selected.filter(id => groups.some(group => group.id === id));
  const select = (ids: (number | string)[]) => setSelected([...new Set(ids.map(Number))].filter(id => groups.some(group => group.id === id)));
  const toggle = (id: number) => select(chosen.includes(id) ? chosen.filter(item => item !== id) : [...chosen, id]);
  const toggleSelecting = () => { setSelecting(value => !value); setSelected([]); setError(''); };
  const open = (id: number | 'new') => {
    if (scope) router.push({ pathname: '/group', params: { id: String(id), server: scope.server, aux: String(scope.aux) } });
  };
  const remove = async () => {
    if (!scope || !chosen.length || pending.current) return;
    pending.current = true; setBusy(true);
    try {
      if (!await session.deleteGroupsAndWait(chosen, scope)) { setError('Could not delete the groups. Select them again and retry.'); return; }
      session.notifySuccess(chosen.length === 1 ? 'Group deleted' : chosen.length + ' groups deleted');
      setSelected([]); setSelecting(false); setError('');
    } catch { setError('Could not delete the groups. Try again.'); }
    finally { pending.current = false; setBusy(false); }
  };
  return { groups, channels, selecting, busy, selected: chosen, select, toggle, toggleSelecting, open, remove, error: error || state.message,
    canCreate: !!scope && !busy, toggleAll: () => select(chosen.length === groups.length ? [] : groups.map(group => group.id)) };
}
