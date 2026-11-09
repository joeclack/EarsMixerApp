import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useSession } from '../mixer/context';
import { orderedChannels, type GroupScope } from '../mixer/model';
import { moveGroupMembers } from '../mixer/groups';

export type GroupEditorProps = { groupId: number | null; scope: GroupScope };
export const closeGroupEditor = () => { if (router.canGoBack()) router.back(); else router.replace('/groups'); };
export function useGroupEditor({ groupId, scope }: GroupEditorProps) {
  const { session, state, mix } = useSession();
  const groups = state.preferences.groupsByAux[String(scope.aux)] || [];
  const global = state.preferences.globalGroups;
  const sourceAll = global.some(group => group.id === groupId);
  const group = global.find(entry => entry.id === groupId) || groups.find(entry => entry.id === groupId);
  const creating = groupId === null;
  const [busy, setBusy] = useState(false);
  const pending = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const sameScope = state.server === scope.server && mix.aux === scope.aux;
  const matching = sameScope && (creating || !!group);
  const [invalidated, setInvalidated] = useState(!matching);
  useEffect(() => { if (!sameScope) setInvalidated(true); }, [sameScope]);
  const valid = sameScope && !invalidated && (creating || !!group || busy);
  const [draft, setDraft] = useState(() => ({ name: group?.name || '', members: [...(group?.members || [])], allAuxes: sourceAll }));
  const [error, setError] = useState('');
  const channels = orderedChannels(mix.config, state.preferences);
  const otherGlobal = global.filter(entry => entry.id !== groupId);
  const otherLocal = Object.entries(state.preferences.groupsByAux).flatMap(([aux, entries]) => entries.filter(entry => !(Number(aux) === scope.aux && !sourceAll && entry.id === groupId)).map(entry => ({ ...entry, aux: Number(aux) })));
  const canApplyAll = ![...otherGlobal, ...otherLocal].some(entry => entry.id === groupId || entry.members.some(id => draft.members.includes(id)));
  const occupied = [...otherGlobal, ...otherLocal.filter(entry => draft.allAuxes || entry.aux === scope.aux)];
  const available = channels.filter(channel => !draft.members.includes(channel.channel) && !occupied.some(entry => entry.members.includes(channel.channel)));
  const members = draft.members.map(id => ({ channel: id, label: channels.find(channel => channel.channel === id)?.label || 'Channel ' + id,
    unavailable: !channels.some(channel => channel.channel === id) }));
  const change = (next: typeof draft) => {
    if (pending.current) return;
    if (!valid || (!creating && session.saveGroup(groupId, next.name, next.members, scope, next.allAuxes) === null)) {
      setError('The available groups or channels changed. Open this group again.'); return;
    }
    setDraft(next); setError('');
  };
  const commit = async (action: () => Promise<boolean>, success: string) => {
    if (!valid || pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      const saved = await action();
      if (!mounted.current) return;
      if (!saved) { setError('Could not save the group. Check the selected channels and try again.'); return; }
      session.notifySuccess(success); closeGroupEditor();
    } catch { if (mounted.current) setError('Could not save the group. Try again.'); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  const save = () => commit(async () => await session.saveGroupAndWait(null, draft.name, draft.members, scope, draft.allAuxes) !== null, 'Group created');
  const remove = () => commit(() => groupId === null ? Promise.resolve(false) : session.deleteGroupsAndWait([groupId], scope), 'Group deleted');
  return { mixName: mix.config?.aux.find(aux => aux.channel === scope.aux)?.label || 'Mix ' + scope.aux, creating, valid, busy, name: draft.name, members, available, error: error || state.message, save, remove, allAuxes: draft.allAuxes, canApplyAll,
    canSave: valid && !busy && draft.members.length >= 2, canRemove: !busy && (creating || draft.members.length > 2),
    rename: (name: string) => change({ ...draft, name: name.slice(0, 80) }),
    setAllAuxes: (allAuxes: boolean) => { if (!allAuxes || canApplyAll) change({ ...draft, allAuxes }); },
    add: (channel: number) => { if (available.some(entry => entry.channel === channel)) change({ ...draft, members: [...draft.members, channel] }); },
    removeMember: (channel: number) => { if (creating || draft.members.length > 2) change({ ...draft, members: draft.members.filter(id => id !== channel) }); },
    move: (indices: number[], destination: number) => change({ ...draft, members: moveGroupMembers(draft.members, indices, destination) }),
    unavailableMessage: state.server !== scope.server || mix.aux !== scope.aux ? 'The mixer or monitor mix changed. Open the group from Channel groups again.' : 'This group is no longer available.' };
}
