'use client';

import { useEffect, useRef } from 'react';

export default function OneSignalInit() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (typeof window === 'undefined') return;
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    const load = async () => {
      if (!('OneSignal' in window)) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
          s.async = true;
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      try {
        // @ts-ignore
        const OneSignal = window.OneSignal || window.OneSignalDeferred || [];
        // @ts-ignore
        window.OneSignal = OneSignal;
        // Configure and initialize
        OneSignal.push(function () {
          OneSignal.init({
            appId: appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: { enable: false },
            serviceWorkerParam: { scope: '/' },
            // Use our unified service worker that includes OneSignal
            serviceWorkerPath: '/service-worker.js',
            serviceWorkerUpdaterPath: '/service-worker.js',
          });

          // Show subscription prompt (can be customized later)
          OneSignal.Slidedown.promptPush({ force: false });
        });

        initialized.current = true;
      } catch (e) {
        // swallow; do not block UI
        console.warn('OneSignal init failed:', e);
      }
    };

    load();
  }, []);

  return null;
}
