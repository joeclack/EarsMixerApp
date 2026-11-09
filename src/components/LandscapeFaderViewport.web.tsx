import type { PropsWithChildren } from 'react';

export default function LandscapeFaderViewport({ enabled, children }: PropsWithChildren<{ enabled: boolean }>) {
  return <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
    maskImage: enabled ? 'linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)' : undefined }}>{children}</div>;
}
