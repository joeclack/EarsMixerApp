import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { MixerViewHandle, MixerViewProps } from './MixerView';

// Browser preview only. Native builds use the persistent platform WebView.
export default forwardRef<MixerViewHandle, MixerViewProps>(function MixerView({ url, onLoading, onError }, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [revision, setRevision] = useState(0);
  useImperativeHandle(ref, () => ({ reload() { onLoading(true); setRevision(value => value + 1); } }));
  return <iframe key={revision} ref={frame} src={url} title="EarsMixer" style={{ flex: 1, width: '100%', border: 0, background: '#101215' }}
    onLoad={() => onLoading(false)} onError={() => onError('Could not load the mixer.')} />;
});
