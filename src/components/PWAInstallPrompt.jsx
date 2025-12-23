'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setShowInstallButton(true);
      console.log('[PWA] Install prompt available');
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] App is already installed');
        return;
      }
      
      // Check if running as PWA
      if (window.navigator.standalone === true) {
        console.log('[PWA] App is running as standalone (iOS)');
        return;
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkIfInstalled();

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed');
      setDeferredPrompt(null);
      setShowInstallButton(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border-2 border-[#F44422] rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Install MultiKonnect</h3>
          <p className="text-sm text-gray-600 mb-3">
            Install our app for a better experience and offline access.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-[#F44422] text-white rounded-md font-semibold text-sm hover:bg-[#d6391a] transition-colors"
            >
              Install Now
            </button>
            <button
              onClick={() => setShowInstallButton(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowInstallButton(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

