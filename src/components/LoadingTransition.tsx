import { useCallback, useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import FaderLoading from './FaderLoading';

// Mount ready content immediately beneath the exit. Keep only the loader alive
// for the animation, rather than delaying metadata, assets or screen rendering.
export default function LoadingTransition({ loading, children }: PropsWithChildren<{ loading: boolean }>) {
  const [visible, setVisible] = useState(loading);
  const current = useRef(loading);
  useLayoutEffect(() => {
    current.current = loading;
    if (loading) setVisible(true);
  }, [loading]);
  const complete = useCallback(() => { if (!current.current) setVisible(false); }, []);
  return <View style={{ flex: 1 }}>
    {!loading && children}
    {(loading || visible) && <View style={StyleSheet.absoluteFill}>
      <FaderLoading finishing={!loading} onFinished={complete} />
    </View>}
  </View>;
}
