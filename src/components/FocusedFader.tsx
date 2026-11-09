import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Fader from './Fader';
import FaderHousing from './FaderHousing';
import FaderDisplay from './FaderDisplay';
import CloseButton from './CloseButton';

export default function FocusedFader({ channel, label, onClose }: { channel: number; label: string; onClose(): void }) {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  return <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, gap: 16 }}>
    <View style={{ width: 88 * 1.6, alignSelf: 'center' }}>
      <FaderDisplay channel={channel} label={label} large fitContent />
    </View>
    <View onLayout={event => setHeight(event.nativeEvent.layout.height)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {height > 0 && <FaderHousing vertical size={1.6}>
        <Fader channel={channel} label={label} vertical size={1.6} length={Math.max(120, height - 24)} />
      </FaderHousing>}
    </View>
    <View style={{ alignItems: 'center' }}>
      <CloseButton label="Close full-screen fader" onPress={onClose} />
    </View>
  </View>;
}
