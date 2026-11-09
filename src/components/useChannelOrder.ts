import { router } from 'expo-router';
import { useSession } from '../mixer/context';
import { hiddenChannels } from '../mixer/model';
import { layoutItems } from '../mixer/layout';

export function useChannelOrder() {
  const { session, state, mix } = useSession();
  const scope = state.server && mix.aux !== null && mix.config ? { server: state.server, aux: mix.aux } : null;
  const hidden = hiddenChannels(mix.config, state.preferences, mix.aux);
  const items = scope ? layoutItems(mix.config, state.preferences, mix.aux).map(item => {
    const shown = item.members.filter(id => !hidden.includes(id)).length;
    return { ...item, visible: shown === item.members.length,
      detail: item.group ? item.members.length + ' channels' + (shown > 0 && shown < item.members.length ? ' · ' + shown + ' shown' : '') : undefined };
  }) : [];
  return { items, error: state.message,
    move: (indices: number[], destination: number) => {
      if (scope) session.moveLayoutItems(items.map(item => item.key), indices, destination, scope);
    },
    show: (key: number, visible: boolean) => { if (scope) session.setLayoutItemHidden(key, !visible, scope); },
    edit: (id: number) => {
      if (scope && session.state.server === scope.server && session.mixer.state.aux === scope.aux)
        router.push({ pathname: '/group', params: { id: String(id), server: scope.server, aux: String(scope.aux) } });
    } };
}
