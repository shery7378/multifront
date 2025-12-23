'use client';

import { useEffect } from 'react';

/**
 * Component to initialize admin default location when user hasn't set their location
 * This ensures products are filtered correctly using admin's default location
 */
export default function DefaultLocationInitializer() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if user has explicitly set their location (not from admin default)
    const userHasExplicitLocation = localStorage.getItem('userLocationSet') === 'true';
    const userLat = localStorage.getItem('lat');
    const userLng = localStorage.getItem('lng');
    const userPostcode = localStorage.getItem('postcode');

    // If user has explicitly set their location, don't override it
    if (userHasExplicitLocation && userLat && userLng) {
      console.log('📍 User has explicitly set location, keeping it:', { lat: userLat, lng: userLng });
      return;
    }

    // If user has postcode but no coordinates, let the geocoding handle it
    if (userPostcode && (!userLat || !userLng)) {
      return;
    }

    // Fetch admin default location and use it
    async function fetchAndSetDefaultLocation() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/default-location`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 200 && data.data) {
            const defaultLat = data.data.default_location_latitude;
            const defaultLng = data.data.default_location_longitude;
            
            // Ensure coordinates are numbers
            const latNum = parseFloat(defaultLat);
            const lngNum = parseFloat(defaultLng);
            
            // Check if current location matches admin default
            const currentLat = parseFloat(userLat || 0);
            const currentLng = parseFloat(userLng || 0);
            const locationMatches = Math.abs(currentLat - latNum) < 0.0001 && Math.abs(currentLng - lngNum) < 0.0001;
            
            // Set admin default location in localStorage
            localStorage.setItem('lat', latNum.toString());
            localStorage.setItem('lng', lngNum.toString());
            
            // Mark that this is admin default, not user-set
            if (!userHasExplicitLocation) {
              localStorage.removeItem('userLocationSet');
            }
            
            console.log('✅ Admin default location set:', {
              lat: latNum,
              lng: lngNum,
              radius: data.data.search_radius_km,
              wasDifferent: !locationMatches,
              previousLocation: userLat && userLng ? { lat: currentLat, lng: currentLng } : null
            });
            
            // Trigger location update event to reload products and stores
            if (!locationMatches) {
              window.dispatchEvent(new CustomEvent('locationUpdated', {
                detail: { lat: latNum, lng: lngNum }
              }));
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching default location:', error);
      }
    }

    // Small delay to ensure localStorage is ready
    setTimeout(fetchAndSetDefaultLocation, 100);
  }, []);

  return null; // This component doesn't render anything
}

