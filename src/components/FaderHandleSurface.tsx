import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// A top-down impression of the desk cap: raised shoulders, a dark concave
// finger groove and curved lip highlights. The centre stripe is the index.
export default memo(function FaderHandleSurface({ vertical, color, ready, dragging }: {
  vertical: boolean; color: string; ready: boolean; dragging: boolean;
}) {
  const start = vertical ? { x: 0.5, y: 0 } : { x: 0, y: 0.5 };
  const end = vertical ? { x: 0.5, y: 1 } : { x: 1, y: 0.5 };
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 3, overflow: 'hidden' }]}>
    <LinearGradient colors={['#71828D', '#34434E', '#101820', '#293640', '#61717C']} locations={[0, 0.14, 0.5, 0.86, 1]}
      start={start} end={end} style={StyleSheet.absoluteFill} />
    <View style={{ position: 'absolute', top: 3, bottom: 3, left: 3, right: 3, borderRadius: 5, borderWidth: 0.5,
      borderColor: '#020508', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={['#465762', '#18242D', '#050A0F', '#0B141C', '#354650']} locations={[0, 0.2, 0.5, 0.8, 1]}
        start={start} end={end} style={StyleSheet.absoluteFill} />
      <View style={vertical
        ? { position: 'absolute', left: -4, right: -4, top: -5, height: 14, borderBottomWidth: 1, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderColor: '#A7BBC5', opacity: 0.45 }
        : { position: 'absolute', top: -4, bottom: -4, left: -5, width: 14, borderRightWidth: 1, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderColor: '#A7BBC5', opacity: 0.45 }} />
      <View style={vertical
        ? { position: 'absolute', left: -4, right: -4, bottom: -5, height: 14, borderTopWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderColor: '#020508', opacity: 0.9 }
        : { position: 'absolute', top: -4, bottom: -4, right: -5, width: 14, borderLeftWidth: 1, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, borderColor: '#020508', opacity: 0.9 }} />
      <View style={{ flexDirection: vertical ? 'column' : 'row', gap: 4 }}>
        {Array.from({ length: 5 }, (_, index) => <View key={index} style={{ width: vertical ? 16 : 1.5, height: vertical ? 1.5 : 16, borderRadius: 1, backgroundColor: '#010406' }}>
          <View style={{ flex: 1, borderRadius: 1, backgroundColor: color, opacity: ready ? dragging ? 0.9 : 0.55 : 0.2,
            shadowColor: color, shadowOpacity: 0.85, shadowRadius: dragging ? 4 : 2, shadowOffset: { width: 0, height: 0 } }} />
        </View>)}
      </View>
    </View>
    <View style={[vertical
      ? { position: 'absolute', top: '50%', marginTop: -1, left: 1, right: 1, height: 2 }
      : { position: 'absolute', left: '50%', marginLeft: -1, top: 1, bottom: 1, width: 2 },
      { backgroundColor: '#DCE7EC', borderRadius: 1, shadowColor: '#000000', shadowOpacity: 0.9, shadowRadius: 1, shadowOffset: { width: 0, height: 1 } }]} />
  </View>;
});
