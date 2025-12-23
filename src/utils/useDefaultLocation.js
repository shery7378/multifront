/**
 * Hook to get and use admin default location when user hasn't set their location
 * This ensures products are filtered by admin's default location
 */
import { useEffect, useState } from 'react';

export function useDefaultLocation() {
  const [defaultLocation, setDefaultLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDefaultLocation() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/default-location`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 200 && data.data) {
            setDefaultLocation({
              lat: data.data.default_location_latitude,
              lng: data.data.default_location_longitude,
              radius: data.data.search_radius_km,
            });
            
            // If user doesn't have location set, use default location
            const userLat = localStorage.getItem('lat');
            const userLng = localStorage.getItem('lng');
            
            if (!userLat || !userLng) {
              localStorage.setItem('lat', data.data.default_location_latitude);
              localStorage.setItem('lng', data.data.default_location_longitude);
              console.log('✅ Using admin default location:', {
                lat: data.data.default_location_latitude,
                lng: data.data.default_location_longitude,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching default location:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDefaultLocation();
  }, []);

  return { defaultLocation, loading };
}

/**
 * Initialize default location on app load
 * Call this in your main layout or app component
 */
export function initializeDefaultLocation() {
  if (typeof window === 'undefined') return;

  // Check if user already has location
  const userLat = localStorage.getItem('lat');
  const userLng = localStorage.getItem('lng');
  
  if (userLat && userLng) {
    return; // User has location, don't override
  }

  // Fetch and set default location
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  fetch(`${apiUrl}/api/default-location`)
    .then(res => res.json())
    .then(data => {
      if (data.status === 200 && data.data) {
        localStorage.setItem('lat', data.data.default_location_latitude);
        localStorage.setItem('lng', data.data.default_location_longitude);
        console.log('✅ Default location initialized:', {
          lat: data.data.default_location_latitude,
          lng: data.data.default_location_longitude,
        });
        
        // Trigger a custom event to reload products
        window.dispatchEvent(new CustomEvent('locationUpdated'));
      }
    })
    .catch(error => {
      console.error('Error initializing default location:', error);
    });
}

