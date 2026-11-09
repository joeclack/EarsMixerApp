import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenSurface from '../src/components/ScreenSurface';
import FaderLoading from '../src/components/FaderLoading';
import NativeButton from '../src/components/NativeButton';

export default function LoadingPreview() {
  const insets = useSafeAreaInsets();
  if (!__DEV__) return <Redirect href="/settings" />;
  return <ScreenSurface>
    <FaderLoading />
    <View style={{ position: 'absolute', top: insets.top + 12, right: insets.right + 16 }}>
      <NativeButton title="Done" symbol="xmark" onPress={() => router.canGoBack() ? router.back() : router.replace('/settings')} />
    </View>
  </ScreenSurface>;
}
