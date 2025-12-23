'use client';

import { useState, useEffect } from 'react';

const CONSENT_TYPES = {
  NECESSARY: 'necessary',
  ANALYTICS: 'analytics',
  MARKETING: 'marketing',
  FUNCTIONAL: 'functional',
};

export default function GDPRConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [consent, setConsent] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const storedConsent = localStorage.getItem('gdpr_consent');
    
    if (storedConsent) {
      const parsed = JSON.parse(storedConsent);
      setConsent(parsed);
      applyConsent(parsed);
    } else {
      // Show banner if no consent given
      setShowBanner(true);
    }
  }, []);

  const applyConsent = (consentData) => {
    // Enable/disable Google Analytics based on consent
    if (typeof window !== 'undefined' && window.gtag) {
      if (consentData.analytics) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      } else {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
        });
      }
    }

    // Store consent preferences
    localStorage.setItem('gdpr_consent', JSON.stringify(consentData));
    localStorage.setItem('gdpr_consent_date', new Date().toISOString());
  };

  const handleAcceptAll = () => {
    const allConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    setConsent(allConsent);
    applyConsent(allConsent);
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    setConsent(minimalConsent);
    applyConsent(minimalConsent);
    setShowBanner(false);
  };

  const handleCustomize = () => {
    // Open customization modal (you can implement this)
    setShowBanner(false);
    // For now, accept all
    handleAcceptAll();
  };

  const handleSavePreferences = (preferences) => {
    setConsent(preferences);
    applyConsent(preferences);
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-oxford-blue mb-2">
              Cookie & Privacy Consent
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
              By clicking "Accept All", you consent to our use of cookies. You can manage your preferences at any time.
            </p>
            <a
              href="/privacy-policy"
              className="text-sm text-vivid-red hover:underline"
            >
              Learn more about our privacy policy
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Reject All
            </button>
            <button
              onClick={handleCustomize}
              className="px-4 py-2 text-sm font-medium text-oxford-blue bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Customize
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-vivid-red rounded-md hover:bg-red-700"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

