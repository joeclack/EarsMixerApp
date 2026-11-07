import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { isAllowedNavigation } from './connection';

export type MixerViewHandle = { reload(): void };
export type MixerViewProps = { url: string; onLoading(loading: boolean): void; onError(message: string): void };

export default forwardRef<MixerViewHandle, MixerViewProps>(function MixerView({ url, onLoading, onError }, ref) {
  const webview = useRef<WebView<object>>(null);
  useImperativeHandle(ref, () => ({ reload: () => webview.current?.reload() }));
  return <WebView<object> ref={webview} source={{ uri: url }} style={{ flex: 1, backgroundColor: '#101215' }}
    originWhitelist={['*']} javaScriptEnabled domStorageEnabled sharedCookiesEnabled
    allowsInlineMediaPlayback setSupportMultipleWindows={false} javaScriptCanOpenWindowsAutomatically={false}
    onLoadStart={() => onLoading(true)} onLoadEnd={() => onLoading(false)}
    onError={() => onError('Connection interrupted. Check your Wi-Fi connection, then retry.')}
    onHttpError={event => { if (event.nativeEvent.url === url) onError('The mixer could not load. Check that EarsMixer is running.'); }}
    onContentProcessDidTerminate={() => webview.current?.reload()}
    onShouldStartLoadWithRequest={request => {
      if (isAllowedNavigation(request.url, url)) return true;
      if (request.navigationType === 'click' && /^https?:\/\//i.test(request.url)) {
        void Linking.openURL(request.url).catch(() => onError('Could not open that link.'));
      }
      return false;
    }} />;
});
