import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../theme';

const positions = [
  [18, 64, 8, 42, 18],
  [56, 12, 46, 4, 56],
  [34, 6, 64, 20, 34],
];
const motions = positions.map(points => ({
  '0%': { transform: [{ translateY: points[0] }] },
  '25%': { transform: [{ translateY: points[1] }] },
  '50%': { transform: [{ translateY: points[2] }] },
  '75%': { transform: [{ translateY: points[3] }] },
  '100%': { transform: [{ translateY: points[4] }] },
}));
const easing = cubicBezier(0.77, 0, 0.175, 1);

export default function FaderLoading() {
  const theme = useTheme();
  const systemReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(systemReducedMotion);
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    const lifecycle = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => { motion.remove(); lifecycle.remove(); };
  }, []);
  return <View testID="loading-faders" accessibilityLabel="Loading mixer" accessibilityRole="progressbar" accessibilityState={{ busy: true }}
    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"
      style={{ flexDirection: 'row', gap: 30, padding: 20 }}>
      {positions.map((points, index) => <View key={index} style={{ width: 22, height: 92, alignItems: 'center' }}>
        <View style={{ width: 4, height: 84, borderRadius: 2, backgroundColor: theme.secondary }} />
        <Animated.View style={{ position: 'absolute', top: 4, left: 0, width: 22, height: 12, borderRadius: 4,
          backgroundColor: theme.tint, borderWidth: 1, borderColor: theme.dark ? '#A5FFF0' : '#005B52',
          transform: [{ translateY: points[0] }],
          ...(!reducedMotion ? { animationName: motions[index], animationDuration: 1800 + index * 180,
            animationIterationCount: 'infinite', animationTimingFunction: easing, animationPlayState: active ? 'running' : 'paused' } : {}) }} />
      </View>)}
    </View>
  </View>;
}
