import { Redirect, router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenSurface from '../src/components/ScreenSurface';
import FaderLoading from '../src/components/FaderLoading';
import NativeButton from '../src/components/NativeButton';

export default function LoadingPreview() {
  const insets = useSafeAreaInsets();
  const [finishing, setFinishing] = useState(false);
  const close = useCallback(() => { if (router.canGoBack()) router.back(); else router.replace('/settings'); }, []);
  if (!__DEV__) return <Redirect href="/settings" />;
  return <ScreenSurface>
    <Stack.Screen options={{ animation: finishing ? 'none' : 'default' }} />
    <FaderLoading finishing={finishing} onFinished={close} />
    <View style={{ position: 'absolute', top: insets.top + 12, right: insets.right + 16 }}>
      <NativeButton title="Done" symbol="xmark" disabled={finishing} onPress={() => setFinishing(true)} />
    </View>
  </ScreenSurface>;
}
