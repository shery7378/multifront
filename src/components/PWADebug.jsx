'use client';

import { useEffect, useState } from 'react';

export default function PWADebug() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPWAStatus = async () => {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
      const isHTTPS = protocol === 'https:';
      const isSecureContext = isHTTPS || isLocalhost;
      
      const info = {
        serviceWorkerSupported: 'serviceWorker' in navigator && isSecureContext,
        serviceWorkerRegistered: false,
        serviceWorkerActive: false,
        manifestExists: false,
        isInstalled: window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator.standalone === true),
        isHTTPS: isSecureContext,
        currentURL: window.location.href,
        hostname: hostname,
        protocol: protocol,
        icons: [],
      };

      // Check service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            info.serviceWorkerRegistered = true;
            info.serviceWorkerActive = registration.active !== null;
          }
        } catch (e) {
          console.error('Error checking service worker:', e);
        }
      }

      // Check manifest
      try {
        const response = await fetch('/manifest.json');
        if (response.ok) {
          info.manifestExists = true;
          const manifest = await response.json();
          info.manifest = manifest;
          info.icons = manifest.icons || [];
        }
      } catch (e) {
        console.error('Error checking manifest:', e);
      }

      setDebugInfo(info);
    };

    checkPWAStatus();

    // Show debug panel if there are issues (only in development)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        if (!debugInfo?.serviceWorkerActive || !debugInfo?.manifestExists) {
          setShowDebug(true);
        }
      }, 2000);
    }
  }, []);

  if (!debugInfo || !showDebug) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border-2 border-blue-500 rounded-lg shadow-lg p-4 max-w-md text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-blue-600">PWA Debug Info</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-gray-500 mb-2">
          URL: {debugInfo.currentURL}
        </div>
        <div className={debugInfo.serviceWorkerSupported ? 'text-green-600' : 'text-red-600'}>
          ✓ Service Worker Supported: {debugInfo.serviceWorkerSupported ? 'Yes' : 'No'}
        </div>
        <div className={debugInfo.serviceWorkerRegistered ? 'text-green-600' : 'text-red-600'}>
          ✓ Service Worker Registered: {debugInfo.serviceWorkerRegistered ? 'Yes' : 'No'}
        </div>
        <div className={debugInfo.serviceWorkerActive ? 'text-green-600' : 'text-yellow-600'}>
          ✓ Service Worker Active: {debugInfo.serviceWorkerActive ? 'Yes' : 'No'}
        </div>
        <div className={debugInfo.manifestExists ? 'text-green-600' : 'text-red-600'}>
          ✓ Manifest Exists: {debugInfo.manifestExists ? 'Yes' : 'No'}
        </div>
        <div className={debugInfo.isHTTPS ? 'text-green-600' : 'text-red-600'}>
          ✓ HTTPS/Localhost: {debugInfo.isHTTPS ? 'Yes' : 'No'}
        </div>
        <div className={debugInfo.isInstalled ? 'text-green-600' : 'text-gray-600'}>
          ✓ Already Installed: {debugInfo.isInstalled ? 'Yes' : 'No'}
        </div>
        <div className="text-gray-600">
          Icons: {debugInfo.icons.length} found
        </div>
        {!debugInfo.isHTTPS && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong className="text-yellow-800">⚠️ Service Workers require HTTPS or localhost!</strong>
            <p className="text-yellow-700 mt-1">
              Access via: <code className="bg-yellow-100 px-1 rounded">http://localhost:3000</code>
            </p>
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t">
        <button
          onClick={() => {
            navigator.serviceWorker.getRegistrations().then(registrations => {
              registrations.forEach(reg => reg.unregister());
              window.location.reload();
            });
          }}
          className="text-xs text-blue-600 hover:underline"
        >
          Clear Service Workers & Reload
        </button>
      </div>
    </div>
  );
}

