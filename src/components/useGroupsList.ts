import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useSession } from '../mixer/context';
import { orderedChannels } from '../mixer/model';

export function useGroupsList() {
  const { session, state, mix } = useSession();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useEffect(() => { setError(''); }, [state.server, mix.aux]);
  const groups = mix.aux === null ? [] : [...state.preferences.globalGroups.map(group => ({ ...group, allAuxes: true })),
    ...(state.preferences.groupsByAux[String(mix.aux)] || []).map(group => ({ ...group, allAuxes: false }))];
  const channels = orderedChannels(mix.config, state.preferences);
  const scope = state.server && mix.aux ? { server: state.server, aux: mix.aux } : null;
  const open = (id: number | 'new') => {
    if (scope) router.push({ pathname: '/group', params: { id: String(id), server: scope.server, aux: String(scope.aux) } });
  };
  const remove = async (ids: number[]) => {
    if (!scope || !ids.length || pending.current) return;
    pending.current = true; setBusy(true);
    try {
      if (!await session.deleteGroupsAndWait(ids, scope)) { setError('Could not delete the group. Try again.'); return; }
      session.notifySuccess(ids.length === 1 ? 'Group deleted' : ids.length + ' groups deleted');
      setError('');
    } catch { setError('Could not delete the groups. Try again.'); }
    finally { pending.current = false; setBusy(false); }
  };
  return { groups, channels, busy, open, remove, error: error || state.message, canCreate: !!scope && !busy };
}
