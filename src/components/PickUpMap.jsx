//src/components/PickUpMap.jsx
'use client';
import { useState, useEffect } from 'react';

export default function PickUpMap() {
  const [mapUrl, setMapUrl] = useState(null); // Changed to null to avoid empty src
  const [showFallback, setShowFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleGeolocation = () => {
      if (!navigator.geolocation) {
        setShowFallback(true);
        setErrorMessage('Geolocation is not supported by your browser. Please use a modern browser with location services.');
        return;
      }

      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        if (permissionStatus.state === 'denied') {
          setShowFallback(true);
          setErrorMessage('Location access is denied. Please enable it in your browser settings.');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setMapUrl(
              `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d${193595.15831132832 / 10}!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0!2z${latitude},${longitude}!5e0!3m2!1sen!2s!4v${Date.now()}!5m2!1sen!2s`
            );
            setShowFallback(false);
            setErrorMessage('');
          },
          (error) => {
            console.log('Geolocation Error Details:', error); // Detailed logging
            setShowFallback(true);
            if (!error || Object.keys(error).length === 0) {
              setErrorMessage('An unexpected error occurred while fetching your location. Please try refreshing the page or check your browser settings.');
            } else {
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  setErrorMessage('Location access was denied. Please enable location permissions in your browser settings.');
                  break;
                case error.POSITION_UNAVAILABLE:
                  setErrorMessage('Location information is unavailable. Please try again later.');
                  break;
                case error.TIMEOUT:
                  setErrorMessage('The request to get your location timed out. Please check your internet connection.');
                  break;
                default:
                  setErrorMessage('An unexpected error occurred while fetching your location. Please try again.');
              }
            }
          },
          { timeout: 10000 } // Added timeout to handle slow responses
        );
      });
    };

    handleGeolocation();
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {showFallback ? (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: 'var(--color-cultured)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            color: 'var(--color-oxford-blue)',
            fontFamily: 'var(--font-manrope), sans-serif',
            fontSize: '1.25rem',
            maxWidth: '80%',
          }}
        >
          <p>{errorMessage}</p>
          <p style={{ color: 'var(--color-vivid-red)', marginTop: '0.5rem', fontWeight: '500' }}>
            Note: Location permission is required for this feature.
          </p>
        </div>
      ) : mapUrl ? (
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      ) : null} {/* Render nothing until mapUrl is set */}
    </div>
  );
}