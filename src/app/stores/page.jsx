// src/app/stores/page.jsx
'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import SharedLayout from '@/components/SharedLayout';
import ResponsiveText from '@/components/UI/ResponsiveText';
import { useGetRequest } from '@/controller/getRequests';
import StoreCard from '@/components/StoreCard';

export default function StoresPage() {
  const deliveryMode = useSelector((state) => state.delivery.mode);
  const { data: stores, error, loading, sendGetRequest: getStores } = useGetRequest();
  const [storeUserIds, setStoreUserIds] = useState({}); // Cache for user_ids by store id
  const fetchingRef = useRef(new Set()); // Track stores currently being fetched
  const lastLocationRef = useRef({ lat: null, lng: null, city: null }); // Track last location to detect changes

  // Function to refresh stores (extracted so it can be called from multiple places)
  const refreshStores = useCallback(async () => {
    console.log('🔄 refreshStores called');
    // Get latest values from localStorage
    let lat = localStorage.getItem('lat');
    let lng = localStorage.getItem('lng');
    let cityName = localStorage.getItem('city');
    
    // Check if location actually changed
    if (lat === lastLocationRef.current.lat && 
        lng === lastLocationRef.current.lng && 
        cityName === lastLocationRef.current.city) {
      console.log('⏭️ Location unchanged, skipping refresh');
      return;
    }
    
    // Update last location
    lastLocationRef.current = { lat, lng, city: cityName };
    
    const modeParam = `mode=${deliveryMode}`;
    let url = `/stores/getAllStores?${modeParam}`;
    
    // Get city name if not already set
    if (!cityName) {
      const postcode = localStorage.getItem('postcode');
      if (postcode) {
        const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
        if (!postalCodePattern.test(postcode.trim())) {
          const parts = postcode.split(',');
          cityName = parts[0].trim();
        }
      }
    }
    
    if (lat && lng) {
      url += `&lat=${lat}&lng=${lng}`;
    }
    
    if (cityName) {
      url += `&city=${encodeURIComponent(cityName)}`;
    }
    
    console.log('🔄 Refreshing stores with URL:', url);
    try {
      await getStores(url);
      console.log('✅ Stores refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing stores:', error);
    }
  }, [deliveryMode, getStores]);

  // Listen for location updates and refresh stores
  useEffect(() => {
    const handleLocationUpdate = (event) => {
      console.log('🔄 Location updated event received:', event?.detail);
      refreshStores();
    };

    // Add listener with capture to ensure it's caught
    window.addEventListener('locationUpdated', handleLocationUpdate, true);
    document.addEventListener('locationUpdated', handleLocationUpdate, true);
    console.log('✅ Location update listeners registered on stores page');

    return () => {
      window.removeEventListener('locationUpdated', handleLocationUpdate, true);
      document.removeEventListener('locationUpdated', handleLocationUpdate, true);
      console.log('❌ Location update listeners removed from stores page');
    };
  }, [refreshStores]); // Use refreshStores in dependencies

  // Initialize lastLocationRef on mount
  useEffect(() => {
    lastLocationRef.current = {
      lat: localStorage.getItem('lat'),
      lng: localStorage.getItem('lng'),
      city: localStorage.getItem('city')
    };
    console.log('📍 Initialized lastLocationRef:', lastLocationRef.current);
  }, []);
  
  // Check for location changes on mount and when deliveryMode changes
  useEffect(() => {
    // Check if location has changed since last fetch
    const currentLat = localStorage.getItem('lat');
    const currentLng = localStorage.getItem('lng');
    const currentCity = localStorage.getItem('city');
    
    const locationChanged = 
      currentLat !== lastLocationRef.current.lat ||
      currentLng !== lastLocationRef.current.lng ||
      currentCity !== lastLocationRef.current.city;
    
    if (locationChanged && (currentLat || currentLng || currentCity)) {
      console.log('📍 Location changed detected, refreshing stores...', {
        old: lastLocationRef.current,
        new: { lat: currentLat, lng: currentLng, city: currentCity }
      });
      refreshStores();
    }
  }, [deliveryMode, refreshStores]);

  useEffect(() => {
    async function fetchStores() {
      let lat = localStorage.getItem('lat');
      let lng = localStorage.getItem('lng');
      
      // Try to get coordinates from postcode if not available
      if ((!lat || !lng) && localStorage.getItem('postcode')) {
        try {
          const { getLatLngFromPostcode } = await import('@/controller/getLatLngFromPostcode');
          const postcode = localStorage.getItem('postcode');
          const coords = await getLatLngFromPostcode(postcode, 'UK');
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
            localStorage.setItem('lat', lat);
            localStorage.setItem('lng', lng);
          }
        } catch (error) {
          console.error('Error getting coordinates from postcode:', error);
        }
      }
      
      // Get default location if still no coordinates
      if (!lat || !lng) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const response = await fetch(`${apiUrl}/api/default-location`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 200 && data.data) {
              lat = data.data.default_location_latitude;
              lng = data.data.default_location_longitude;
              localStorage.setItem('lat', lat.toString());
              localStorage.setItem('lng', lng.toString());
            }
          }
        } catch (error) {
          console.error('Error fetching default location:', error);
        }
      }
      
      const modeParam = `mode=${deliveryMode}`;
      let url = `/stores/getAllStores?${modeParam}`;
      const postcode = localStorage.getItem('postcode');
      
      // Check if postcode is a valid UK postcode format
      const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
      const isPostcode = postcode && postalCodePattern.test(postcode.trim());
      
      // If we have coordinates, use them for filtering
      if (lat && lng) {
        url += `&lat=${lat}&lng=${lng}`;
        // If it's a postcode, also send it for exact matching and use smaller radius
        if (isPostcode) {
          url += `&postcode=${encodeURIComponent(postcode.trim())}`;
          url += `&radius=2`; // Use smaller radius (2km) for postcode searches
          console.log('📍 Using coordinates + postcode for precise store filtering:', { lat, lng, postcode: postcode.trim() });
        } else {
          console.log('🌍 Using coordinates for store filtering:', { lat, lng });
        }
      } else {
        // Only use city/postcode filtering if we don't have coordinates
        if (isPostcode) {
          // Send postcode for exact matching
          url += `&postcode=${encodeURIComponent(postcode.trim())}`;
          console.log('📮 Using postcode for store filtering:', postcode.trim());
        } else {
          // Use city filtering for non-postcode entries
          let cityName = localStorage.getItem('city');
          
          // If no city in localStorage, try to extract from postcode
          if (!cityName && postcode) {
            const parts = postcode.split(',');
            cityName = parts[0].trim();
          }
          
          // Add city parameter if we have a city name and no coordinates
          if (cityName) {
            url += `&city=${encodeURIComponent(cityName)}`;
            console.log('✅ Adding city parameter to URL (no coordinates):', cityName);
          } else {
            console.log('⚠️ No city name or coordinates available to send to API');
          }
        }
      }
      
      console.log('🔗 Final API URL:', url);
      await getStores(url);
      
      // Update last location ref after successful fetch
      lastLocationRef.current = {
        lat: localStorage.getItem('lat'),
        lng: localStorage.getItem('lng'),
        city: localStorage.getItem('city')
      };
    }
    fetchStores();
  }, [deliveryMode]);

  // Extract stores from API response
  // The API returns: { status: 200, message: "...", data: [...stores...] }
  // useGetRequest sets data = res.data, so stores is the full response object
  // We need to access stores.data to get the array
  const allStores = (stores && stores.data) ? stores.data : (Array.isArray(stores) ? stores : []);

  // Debug: Log store data
  useEffect(() => {
    console.log('📦 Full stores response:', stores);
    console.log('📦 Stores type:', typeof stores);
    console.log('📦 Stores is array?', Array.isArray(stores));
    console.log('📦 Stores.data exists?', !!(stores && stores.data));
    console.log('📦 Stores.data type:', stores?.data ? typeof stores.data : 'N/A');
    console.log('📦 Stores.data is array?', Array.isArray(stores?.data));
    console.log('📦 Extracted stores array:', allStores);
    console.log('📦 Stores count:', allStores.length);
    if (allStores.length > 0) {
      console.log('✅ Stores found! First store:', allStores[0]);
      console.log('📦 Store keys:', allStores[0] ? Object.keys(allStores[0]) : 'No stores');
    } else {
      console.log('⚠️ No stores found in response');
      console.log('📦 Available keys in stores object:', stores ? Object.keys(stores) : 'stores is null/undefined');
    }
  }, [stores, allStores]);

  // Fetch user_id for stores that don't have it
  useEffect(() => {
    if (!allStores.length) return;

    async function fetchMissingUserIds() {
      const storesToFetch = allStores.filter(
        store => {
          const storeId = store.id || store.slug;
          const needsFetch = !store.user_id && storeId && !storeUserIds[storeId] && !fetchingRef.current.has(storeId);
          if (needsFetch) {
            console.log(`🔍 Need to fetch user_id for store: ${store.name} (ID: ${storeId})`);
          }
          return needsFetch;
        }
      );

      console.log(`📊 Stores to fetch user_id for: ${storesToFetch.length}`);

      if (storesToFetch.length === 0) return;

      const fetchPromises = storesToFetch.map(async (store) => {
        const storeId = store.id || store.slug;
        if (!storeId) return;

        // Mark as fetching
        fetchingRef.current.add(storeId);
        console.log(`⏳ Fetching user_id for store: ${store.name} (${storeId})`);

        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/stores/${storeId}`;
          console.log(`🌐 Fetching from: ${apiUrl}`);
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Store ${storeId} response:`, data);
            const userId = data?.data?.user_id || data?.user_id;
            if (userId) {
              console.log(`✅ Found user_id ${userId} for store ${storeId}`);
              setStoreUserIds(prev => {
                // Prevent duplicate updates
                if (prev[storeId]) return prev;
                return { ...prev, [storeId]: userId };
              });
            } else {
              console.warn(`⚠️ No user_id found for store ${storeId}`, data);
            }
          } else {
            console.error(`❌ Failed to fetch store ${storeId}:`, response.status, response.statusText);
          }
        } catch (error) {
          console.error(`❌ Error fetching user_id for store ${storeId}:`, error);
        } finally {
          // Remove from fetching set
          fetchingRef.current.delete(storeId);
        }
      });

      await Promise.all(fetchPromises);
    }

    fetchMissingUserIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStores]);

  // Normalize stores with user_id
  const normalizedStores = useMemo(() => {
    console.log('🔄 Normalizing stores. Input count:', allStores.length);
    const normalized = allStores.map(store => {
      const storeId = store.id || store.slug;
      const userId = store.user_id || storeUserIds[storeId] || null;
      
      // Debug log
      if (!userId) {
        console.log(`⚠️ Store "${store.name}" (${storeId}) has no user_id`);
      }
      
      return {
        ...store,
        user_id: userId
      };
    });
    
    console.log('📋 Normalized stores count:', normalized.length);
    console.log('📋 Normalized stores:', normalized.map(s => ({ name: s.name, user_id: s.user_id })));
    if (normalized.length === 0 && allStores.length > 0) {
      console.error('⚠️ WARNING: Stores were lost during normalization!');
      console.log('📋 Input stores:', allStores);
    }
    return normalized;
  }, [allStores, storeUserIds]);

  if (loading) return <p>Loading stores...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <SharedLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 min-h-[60vh]">
        <div className="mb-5 flex items-center gap-3">
          <ResponsiveText
            as="h1"
            minSize="1.125rem"
            maxSize="1.5rem"
            className="font-semibold text-oxford-blue"
          >
            All Stores
          </ResponsiveText>
          <span className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-700 border border-gray-200">
            {allStores.length} results
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {normalizedStores && normalizedStores.length > 0 ? (
            normalizedStores.map((store, index) => {
            // Normalize store data for StoreCard component
            const logoUrl = store.logo 
              ? (store.logo.startsWith('http') ? store.logo : `${process.env.NEXT_PUBLIC_API_URL || ''}/${store.logo}`)
              : '/images/NoImageSmall.jpg';
            
            // Debug log for each store card
            if (index === 0) {
              console.log(`🎴 Rendering StoreCard for "${store.name}":`, {
                id: store.id,
                slug: store.slug,
                user_id: store.user_id,
                hasUserId: !!store.user_id
              });
            }
            
            return (
              <StoreCard
                key={store.id || store.slug || store.name || index}
                index={index}
                id={store.id}
                name={store.name}
                slug={store.slug}
                rating={store.rating}
                deliveryTime={store.delivery_time_text || store.deliveryTime || store.eta}
                prepTime={store.prep_time || store.preparation_time}
                offer={store.offer}
                award={store.award}
                choice={store.choice}
                cuisine={store.cuisine || store.category_name}
                note={store.note}
                logo={logoUrl}
                offersPickup={store.offers_pickup || store.offersPickup}
                offersDelivery={store.offers_delivery || store.offersDelivery}
                user_id={store.user_id || null} // Pass user_id for Contact Vendor button
              />
            );
          })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No stores found. Please try a different location.</p>
              <p className="text-sm text-gray-400 mt-2">
                {stores?.location_info?.city ? `Searched for: ${stores.location_info.city}` : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </SharedLayout>
  );
}
