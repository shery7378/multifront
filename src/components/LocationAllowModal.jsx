// src/components/LocationAllowModal.jsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import GoogleMapController from "@/controller/GoogleMapController";
import { useSelector } from 'react-redux';
import { usePostRequest } from '@/controller/postRequests';

// Define libraries as a const outside component to avoid performance warnings
const GOOGLE_MAPS_LIBRARIES = ["places"];

// Postcode patterns for validation
const postalCodePatterns = [
  /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, // UK format
  /^\d{5}(-\d{4})?$/, // US format
  /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i // Canada format
];

export default function LocationAllowModal({ isOpen, onClose, onSave }) {
  const [inputMode, setInputMode] = useState("address"); // "address" or "postcode"
  const [country, setCountry] = useState("United Kingdom");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [location, setLocation] = useState(null); // { lat, lng }
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);
  const [cityName, setCityName] = useState(null); // Store extracted city name
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedArea, setSelectedArea] = useState("Not set");
  const [eta, setEta] = useState("—");
  const autocompleteRef = useRef(null);
  const streetInputRef = useRef(null);
  const placeSelectedRef = useRef(false); // Track if user selected a place (using ref to avoid stale closures)
  
  // Get user authentication token
  const { token } = useSelector((state) => state.auth);
  const { sendPostRequest: createAddress } = usePostRequest();
  const { sendPostRequest: setDefaultAddress } = usePostRequest();
  
  // Suggested postcodes
  const suggestedPostcodes = ["SW1A 1AA", "E1 6AN", "W1J 9HP"];

  // List of countries for dropdown
  const countries = [
    "United Kingdom", "United States", "Canada", "Australia", "New Zealand",
    "Ireland", "France", "Germany", "Italy", "Spain", "Netherlands", "Belgium",
    "Switzerland", "Austria", "Sweden", "Norway", "Denmark", "Finland",
    "Poland", "Portugal", "Greece", "Czech Republic", "Hungary", "Romania",
    "India", "China", "Japan", "South Korea", "Singapore", "Malaysia",
    "Thailand", "Indonesia", "Philippines", "Vietnam", "United Arab Emirates",
    "Saudi Arabia", "South Africa", "Brazil", "Mexico", "Argentina", "Chile"
  ];

  // Map country names to ISO country codes for Google Places API
  const countryCodeMap = {
    "United Kingdom": "gb",
    "United States": "us",
    "Canada": "ca",
    "Australia": "au",
    "New Zealand": "nz",
    "Ireland": "ie",
    "France": "fr",
    "Germany": "de",
    "Italy": "it",
    "Spain": "es",
    "Netherlands": "nl",
    "Belgium": "be",
    "Switzerland": "ch",
    "Austria": "at",
    "Sweden": "se",
    "Norway": "no",
    "Denmark": "dk",
    "Finland": "fi",
    "Poland": "pl",
    "Portugal": "pt",
    "Greece": "gr",
    "Czech Republic": "cz",
    "Hungary": "hu",
    "Romania": "ro",
    "India": "in",
    "China": "cn",
    "Japan": "jp",
    "South Korea": "kr",
    "Singapore": "sg",
    "Malaysia": "my",
    "Thailand": "th",
    "Indonesia": "id",
    "Philippines": "ph",
    "Vietnam": "vn",
    "United Arab Emirates": "ae",
    "Saudi Arabia": "sa",
    "South Africa": "za",
    "Brazil": "br",
    "Mexico": "mx",
    "Argentina": "ar",
    "Chile": "cl"
  };

  // Get country code for current country
  const getCountryCode = (countryName) => {
    return countryCodeMap[countryName] || null;
  };

  // Load Google Maps API with Places library
  // Use the same script ID as other components to share the loaded script
  const apiKey = process.env.NEXT_PUBLIC_MAP_KEY || "";
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script", // Use same ID to share loaded script
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: "weekly",
  });

  // Function to calculate ETA based on location
  const calculateETA = useCallback(async (lat, lng) => {
    if (!lat || !lng) {
      setEta("—");
      return;
    }

    try {
      // Try to fetch nearby stores to calculate ETA
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const storesUrl = `${baseUrl}/api/stores/getNearbyStores?lat=${lat}&lng=${lng}&radius=10`;
      
      try {
        const response = await fetch(storesUrl);
        if (response.ok) {
          const storesData = await response.json();
          if (storesData && storesData.data && storesData.data.length > 0) {
            // Find the nearest store
            const nearestStore = storesData.data[0];
            if (nearestStore.distance !== undefined) {
              // Calculate ETA based on distance (rough estimate: 30-60 minutes for delivery)
              const distanceKm = nearestStore.distance;
              let estimatedMinutes;
              
              if (distanceKm < 2) {
                estimatedMinutes = "30-45 min";
              } else if (distanceKm < 5) {
                estimatedMinutes = "45-60 min";
              } else if (distanceKm < 10) {
                estimatedMinutes = "60-90 min";
              } else {
                estimatedMinutes = "90-120 min";
              }
              
              setEta(estimatedMinutes);
              return;
            }
          }
        }
      } catch (err) {
        console.log("Could not fetch stores for ETA calculation");
      }

      // Fallback: Calculate based on area type (urban vs rural)
      // Use reverse geocoding to determine area type
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
        // Default ETA for urban areas
        setEta("30-60 min");
      } else {
        setEta("60-90 min");
      }
    } catch (err) {
      console.error("Error calculating ETA:", err);
      // Default ETA
      setEta("30-60 min");
    }
  }, [apiKey]);

  // Function to geocode an address/postcode and update the map
  const geocodeAndUpdateMap = useCallback(async (address, validateCountry = true) => {
    if (!address || !address.trim()) return false;
    if (!apiKey) return false;
    
    try {
      // Use Google Geocoding API directly for better results
      // Add country restriction if validating
      let geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address.trim())}&key=${apiKey}`;
      if (validateCountry) {
        const countryCode = getCountryCode(country);
        if (countryCode) {
          geocodeUrl += `&region=${countryCode}`;
        }
      }
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        
        // Extract country from geocoded result
        const addressComponents = result.address_components || [];
        const countryComp = addressComponents.find((c) => c.types.includes("country"));
        const geocodedCountry = countryComp?.long_name || "";
        
        const locationData = {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        };
        
        // Extract address components - loop through ALL components like signup page
        let postalCode = "";
        let cityComp = null;
        let streetNumber = "";
        let route = "";
        
        // Loop through all components to extract postal code (like signup page)
        for (const c of addressComponents) {
          const types = c.types || [];
          
          // Extract postal code - try multiple ways like signup page
          // Use long_name first, then short_name (matching signup page exactly)
          if (!postalCode) {
            if (types.includes("postal_code")) {
              postalCode = c.long_name || c.short_name || "";
            } else if (types.includes("postal_code_prefix")) {
              postalCode = c.long_name || c.short_name || "";
            }
          }
          
          // Extract city
          if (!cityComp) {
            if (types.includes("locality")) {
              cityComp = c;
            } else if (types.includes("postal_town")) {
              cityComp = c;
            } else if (types.includes("administrative_area_level_2")) {
              cityComp = c;
            } else if (types.includes("administrative_area_level_1") && !cityComp) {
              cityComp = c;
            } else if (types.includes("sublocality") && !cityComp) {
              cityComp = c;
            } else if (types.includes("sublocality_level_1") && !cityComp) {
              cityComp = c;
            }
          }
          
          // Extract street components
          if (types.includes("street_number")) {
            streetNumber = c.long_name || "";
          }
          if (types.includes("route")) {
            route = c.long_name || "";
          }
        }
        
        // Log all address components for debugging
        console.log("🔍 Address components from geocoding:", addressComponents.map(c => ({
          types: c.types,
          long_name: c.long_name,
          short_name: c.short_name
        })));
        
        // ALWAYS update country to match geocoded result (this is the source of truth)
        if (countryComp) {
          const newCountry = countryComp.long_name;
          if (newCountry !== country) {
            // Show warning if country changed
            setError(`⚠️ Address is in ${newCountry}. Country updated from ${country} to ${newCountry}.`);
            setCountry(newCountry);
          } else {
            setError("");
          }
        }
        
        // Update ALL address fields to match geocoded result
        // ALWAYS update postcode if found
        if (postalCode) {
          setPostcode(postalCode);
          console.log("✅ Postcode extracted from geocoding:", postalCode);
        } else {
          // Fallback 1: If the input address itself looks like a postcode, use it
          const inputIsPostcode = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(address.trim()) ||
                                  /^\d{5}(-\d{4})?$/.test(address.trim()) ||
                                  /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(address.trim());
          if (inputIsPostcode) {
            setPostcode(address.trim());
            console.log("✅ Using input as postcode (looks like a postcode):", address.trim());
            postalCode = address.trim();
          } else {
            // Fallback 2: Try to extract postcode from formatted address using regex (like signup page)
            if (result.formatted_address) {
              const postalCodePatterns = [
                /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i, // UK format
                /\b(\d{5}(?:-\d{4})?)\b/, // US format
                /\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i, // Canadian format
                /\b(\d{4,6})\b/, // Generic numeric (4-6 digits)
                /\b([A-Z]{1,2}\d{1,4})\b/i, // Generic alphanumeric
              ];
              
              for (const pattern of postalCodePatterns) {
                const match = result.formatted_address.match(pattern);
                if (match && match[1]) {
                  postalCode = match[1].trim();
                  setPostcode(postalCode);
                  console.log("✅ Postcode extracted from formatted address:", postalCode);
                  break;
                }
              }
            }
          }
        }
        
        // ALWAYS update city if found (critical for street-only entries)
        if (cityComp) {
          setCity(cityComp.long_name);
          setCityName(cityComp.long_name);
          console.log("✅ City extracted from components:", cityComp.long_name);
        } else {
          // Try to extract city from formatted address if no city component found
          if (result.formatted_address) {
            const parts = result.formatted_address.split(',');
            // Usually city is the second or third part (skip street address)
            for (let i = 1; i < Math.min(parts.length, 4); i++) {
              const part = parts[i].trim();
              // Check if it looks like a city (not a country code, not a postcode, not empty)
              const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
              const usPostalPattern = /^\d{5}(-\d{4})?$/;
              const isCountry = part === countryComp?.long_name || countries.includes(part);
              if (part && !part.match(/^\d+$/) && part.length > 2 && !postalCodePattern.test(part) && !usPostalPattern.test(part) && !isCountry) {
                setCity(part);
                setCityName(part);
                console.log("✅ City extracted from formatted address:", part);
                break;
              }
            }
          }
        }
        
      // ALWAYS update street address from geocoded result to ensure accuracy
// Check if what user entered looks like a city name (not a street address)
const enteredIsCity = !streetNumber && !route && address.trim().split(',').length <= 2;

// If user entered just a street name, preserve it
if (!streetNumber && !route && streetAddress.trim() && streetAddress.trim() === address.trim()) {
  console.log("✅ Preserving user-entered street name:", streetAddress);
  // Don't clear the street address if user entered just a street
  // The geocoded result might not have street components
} else if (streetNumber || route) {
  // We have proper street components - use them
  const geocodedStreet = `${streetNumber} ${route}`.trim();
  setStreetAddress(geocodedStreet);
  console.log("✅ Street address updated from geocoding:", geocodedStreet);
} else if (enteredIsCity && cityComp) {
  // User entered a city name in street field - clear street and use city
  setStreetAddress("");
  if (cityComp) {
    setCity(cityComp.long_name);
    setCityName(cityComp.long_name);
  }
  console.log("✅ Detected city name in street field, moved to city field");
} else {
  // Try to extract street from formatted address
  if (result.formatted_address) {
    const parts = result.formatted_address.split(',');
    // First part might be street, but only if it's not the city
    if (parts[0] && parts[0].trim() !== cityComp?.long_name && parts[0].trim() !== city) {
      // Check if first part looks like a street (has numbers or common street words)
      const streetPattern = /(street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|boulevard|blvd|circle|cir)/i;
      if (parts[0].trim().match(/\d/) || streetPattern.test(parts[0].trim())) {
        setStreetAddress(parts[0].trim());
      } else {
        // Doesn't look like a street, probably a city - keep existing if user entered it
        if (!streetAddress.trim()) {
          setStreetAddress("");
        }
      }
    } else {
      // Keep existing street address if user entered one
      if (!streetAddress.trim()) {
        setStreetAddress("");
      }
    }
  }
}
        
        // Set location and coordinates (this triggers map display)
        setLocation(locationData);
        setCoords(locationData);
        setSelectedArea(result.formatted_address || address || "Not set");
        
        // Calculate ETA for this location
        await calculateETA(locationData.lat, locationData.lng);
        
        console.log("✅ Map updated with location:", locationData, "City:", cityComp?.long_name || "extracted from address");
        
        console.log("✅ Map updated with location:", locationData);
        return true;
      } else {
        console.warn("Geocoding failed:", data.status);
        if (validateCountry) {
          setError(`Could not find this address in ${country}. Please check the address or try a different country.`);
        }
        return false;
      }
    } catch (err) {
      console.error("Error geocoding:", err);
      return false;
    }
  }, [apiKey, postcode, city, streetAddress, calculateETA, country]);

  // Debounce geocoding when user manually types postcode (only in postcode mode)
  useEffect(() => {
    if (!postcode || !postcode.trim() || inputMode !== "postcode") return;
    if (!isLoaded) return; // Wait for Google Maps to load
    
    // Debounce the geocoding
    const timeoutId = setTimeout(async () => {
      // Check if it looks like a valid postcode (any format)
      const postalCodePatterns = [
        /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, // UK format
        /^\d{5}(-\d{4})?$/, // US format
        /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, // Canadian format
        /^\d{4,6}$/, // Generic numeric (4-6 digits)
        /^[A-Z]{1,2}\d{1,4}$/i, // Generic alphanumeric
      ];
      
      const looksLikePostcode = postalCodePatterns.some(pattern => pattern.test(postcode.trim()));
      
      // Always geocode if it looks like a postcode, or if it's at least 3 characters (might be a partial postcode)
      if (looksLikePostcode || postcode.trim().length >= 3) {
        // Always validate country when geocoding postcode
        await geocodeAndUpdateMap(postcode.trim(), true);
      }
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [postcode, inputMode, isLoaded, geocodeAndUpdateMap]);

  // Auto-geocode when street address is entered (address mode) - works with or without city
  useEffect(() => {
    if (inputMode !== "address") return;
    if (!isLoaded || !apiKey) return;
    if (!streetAddress.trim()) return;
    
    // Don't auto-geocode on very short inputs (user is still typing)
    // Minimum 3 characters to avoid geocoding single letters like "t"
    if (streetAddress.trim().length < 3) {
      return;
    }
    
    // Don't auto-geocode if user just selected from autocomplete
    // The onPlaceChanged handler will handle that case
    if (placeSelectedRef.current) {
      // Reset flag after a moment
      setTimeout(() => {
        placeSelectedRef.current = false;
      }, 1000);
      return;
    }
    
    // Debounce the geocoding
    const timeoutId = setTimeout(async () => {
      // Only geocode if location is not already set (to avoid overwriting autocomplete selection)
      if (location) {
        console.log("ℹ️ Location already set, skipping auto-geocode");
        return;
      }
      
      // Build address with available fields
      let addressToGeocode = streetAddress.trim();
      if (city.trim()) {
        addressToGeocode = `${addressToGeocode}, ${city.trim()}, ${country}`;
      } else {
        // If no city, just use street + country
        addressToGeocode = `${addressToGeocode}, ${country}`;
      }
      console.log("🔄 Auto-geocoding address (manual entry):", addressToGeocode);
      // Always validate country when auto-geocoding
      const success = await geocodeAndUpdateMap(addressToGeocode, true);
      if (!success) {
        console.log("⚠️ Geocoding failed");
      }
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [streetAddress, city, country, inputMode, isLoaded, apiKey, geocodeAndUpdateMap, location]);

  // Log API key status (always log to help debug)
  useEffect(() => {
    console.log('🔑 [LocationModal] Google Maps API Key Status:', {
      hasKey: !!apiKey,
      keyLength: apiKey.length,
      keyPreview: apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT SET',
      isLoaded,
      loadError: loadError?.message || null,
      loadErrorDetails: loadError,
    });
    
    // Also check if window.google exists
    if (typeof window !== 'undefined') {
      console.log('🌐 [LocationModal] window.google exists:', !!window.google);
      if (window.google && window.google.maps) {
        console.log('🗺️ [LocationModal] Google Maps API loaded successfully');
      }
    }
  }, [apiKey, isLoaded, loadError]);

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset state when modal opens
    setInputMode("address");
    setCountry("United Kingdom");
    setStreetAddress("");
    setCity("");
    setPostcode("");
    setError("");
    setLocation(null);
    setCoords(null);
    setCityName(null);
    setSelectedArea("Not set");
    setEta("—");
    placeSelectedRef.current = false; // Reset place selected flag

    // Try to get user's location automatically (silently, don't show errors immediately)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          // Don't set error if user already selected a place
          if (placeSelectedRef.current) return;
          
          const { latitude, longitude } = pos.coords;
          const locationData = { lat: latitude, lng: longitude };
          setLocation(locationData);
          setCoords(locationData);
          
          // Calculate ETA
          calculateETA(latitude, longitude);

          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_MAP_KEY}`
            );
            const data = await res.json();
            if (data.results.length > 0) {
              const place = data.results[0];
              const components = place.address_components || [];
              
              // Loop through all components to extract values (like signup page)
              let postalCode = "";
              let cityComp = null;
              let streetNumber = "";
              let route = "";
              
              for (const c of components) {
                const types = c.types || [];
                
                // Extract postal code - try multiple ways like signup page
                // Use long_name first, then short_name (matching signup page exactly)
                if (!postalCode) {
                  if (types.includes("postal_code")) {
                    postalCode = c.long_name || c.short_name || "";
                  } else if (types.includes("postal_code_prefix")) {
                    postalCode = c.long_name || c.short_name || "";
                  }
                }
                
                // Extract city
                if (!cityComp) {
                  if (types.includes("locality")) {
                    cityComp = c;
                  } else if (types.includes("postal_town")) {
                    cityComp = c;
                  } else if (types.includes("administrative_area_level_2")) {
                    cityComp = c;
                  }
                }
                
                // Extract street components
                if (types.includes("street_number")) {
                  streetNumber = c.long_name || "";
                }
                if (types.includes("route")) {
                  route = c.long_name || "";
                }
              }
              
              // Only set fields if user hasn't selected a place
              if (!placeSelectedRef.current) {
                if (postalCode) setPostcode(postalCode);
                if (cityComp) {
                  setCity(cityComp.long_name);
                  setCityName(cityComp.long_name);
                }
                if (streetNumber || route) setStreetAddress(`${streetNumber} ${route}`.trim());
                setSelectedArea(place.formatted_address || "Not set");
              }
            }
          } catch (err) {
            // Silently fail - don't show error for automatic location detection
            console.log("Could not fetch location details automatically");
          }
        },
        () => {
          // Silently fail - don't show error for automatic location detection
          // User can manually enter or use "Use my location" button
        }
      );
    }
  }, [isOpen]);

  // Show error if API key is missing or there's a load error
  useEffect(() => {
    if (!apiKey || apiKey.trim() === "") {
      setError("Google Maps API key is not configured. Please set NEXT_PUBLIC_MAP_KEY in .env.local file.");
      console.error('❌ [LocationModal] API key is missing!');
    } else if (loadError) {
      const errorMsg = loadError.message || 'Unknown error';
      setError(`Failed to load Google Maps: ${errorMsg}. Check console for details.`);
      console.error('❌ [LocationModal] Google Maps load error:', loadError);
    } else if (apiKey && !isLoaded) {
      // Don't show error while loading, just wait
      console.log('⏳ [LocationModal] Waiting for Google Maps to load...');
    }
  }, [apiKey, loadError, isLoaded]);

  if (!isOpen) return null;

  // Handle place selection from autocomplete
  // Use PlacesService.getDetails() to get full place information
  const onPlaceChanged = async () => {
    console.log("📍 onPlaceChanged called");
    
    // Get autocomplete from ref (more reliable than state)
    const currentAutocomplete = autocompleteRef.current || autocomplete;
    
    console.log("🔍 Autocomplete check:", {
      hasRef: !!autocompleteRef.current,
      hasState: !!autocomplete,
      currentAutocomplete: !!currentAutocomplete,
      refType: typeof autocompleteRef.current,
      stateType: typeof autocomplete
    });
    
    if (!currentAutocomplete) {
      console.warn("⚠️ Autocomplete is not available");
      return;
    }
    
    // Check if getPlace method exists
    if (typeof currentAutocomplete.getPlace !== 'function') {
      console.error("❌ getPlace is not a function on autocomplete:", currentAutocomplete);
      return;
    }
    
    try {
      // Sometimes getPlace() returns null immediately after selection
      // Retry a few times with small delays to wait for place to be fully loaded
      let place = null;
      let retries = 0;
      const maxRetries = 10; // Increased retries
      
      // Try to get the place, with retries
      while (retries < maxRetries) {
        try {
          place = currentAutocomplete.getPlace();
          
          // Check if we got a valid place
          if (place && typeof place === 'object') {
            const hasUsefulData = place.name || place.formatted_address || place.geometry || place.place_id;
            if (hasUsefulData) {
              console.log(`✅ Place loaded successfully on attempt ${retries + 1}`);
              break; // We have a valid place, exit the loop
            }
          }
        } catch (err) {
          console.warn(`⚠️ Error getting place on attempt ${retries + 1}:`, err);
        }
        
        if (retries < maxRetries - 1) {
          console.log(`🔄 Waiting for place to load... (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 150)); // Wait 150ms
        }
        retries++;
      }
      
      // Check if place is valid - it should be an object with at least a name or formatted_address
      if (!place || typeof place !== 'object') {
        console.log("ℹ️ Place not yet selected or still loading (no place object after retries)");
        console.log("🔍 Autocomplete state:", {
          hasAutocomplete: !!currentAutocomplete,
          getPlaceResult: place,
          placeType: typeof place,
          autocompleteMethods: Object.keys(currentAutocomplete || {})
        });
        
        // Try to get the input value as a fallback
        try {
          const inputValue = streetInputRef.current?.value || streetAddress;
          if (inputValue && inputValue.trim().length >= 3) {
            console.log("🔄 Trying to geocode input value as fallback:", inputValue);
            let addressToGeocode = inputValue.trim();
            if (city.trim()) {
              addressToGeocode = `${addressToGeocode}, ${city.trim()}, ${country}`;
            } else {
              addressToGeocode = `${addressToGeocode}, ${country}`;
            }
            await geocodeAndUpdateMap(addressToGeocode, true);
            return;
          }
        } catch (fallbackErr) {
          console.warn("⚠️ Fallback geocoding failed:", fallbackErr);
        }
        
        return;
      }
      
      // Check if place has any useful data (name, formatted_address, or geometry)
      const hasUsefulData = place.name || place.formatted_address || place.geometry || place.place_id;
      if (!hasUsefulData) {
        console.log("ℹ️ Place not yet selected or still loading (no useful data after retries)");
        console.log("🔍 Place object:", place);
        return;
      }
      
      console.log("✅ Place selected:", {
        hasName: !!place.name,
        hasFormattedAddress: !!place.formatted_address,
        hasGeometry: !!place.geometry,
        hasPlaceId: !!place.place_id,
        hasAddressComponents: !!(place.address_components && place.address_components.length > 0),
        placeObject: place
      });
      
      // Mark that user has selected a place
      placeSelectedRef.current = true;
      
      // Get full place details using PlacesService if we have place_id
      // Always fetch full details to ensure we get complete address_components
      let fullPlace = place;
      let addressComponents = place.address_components || [];
      
      // Always try to fetch full details if we have place_id (more reliable)
      if (place.place_id && window.google && window.google.maps && window.google.maps.places) {
        console.log("🔄 Fetching full place details using PlacesService...");
        
        try {
          const service = new window.google.maps.places.PlacesService(document.createElement('div'));
          
          const request = {
            placeId: place.place_id,
            fields: ['geometry', 'formatted_address', 'address_components', 'name', 'place_id', 'types']
          };
          
          await new Promise((resolve, reject) => {
            service.getDetails(request, (result, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
                fullPlace = result;
                addressComponents = result.address_components || [];
                console.log("✅ Full place details fetched with", addressComponents.length, "components");
                resolve(result);
              } else {
                console.warn("⚠️ Could not fetch full place details, using partial:", status);
                // Keep using the original place object
                resolve(place);
              }
            });
          });
        } catch (err) {
          console.warn("⚠️ Error fetching place details:", err);
          // Continue with partial place
        }
      }
      
      // If still no address components, try to parse from formatted_address
      if ((!addressComponents || addressComponents.length === 0) && fullPlace.formatted_address) {
        console.log("⚠️ No address components found, parsing from formatted_address");
      }
      
      // Get location from geometry if available, otherwise we'll geocode later
      let locationData = null;
      let lat = null;
      let lng = null;
      
      if (fullPlace.geometry && fullPlace.geometry.location) {
        lat = typeof fullPlace.geometry.location.lat === 'function' 
          ? fullPlace.geometry.location.lat() 
          : fullPlace.geometry.location.lat;
        lng = typeof fullPlace.geometry.location.lng === 'function' 
          ? fullPlace.geometry.location.lng() 
          : fullPlace.geometry.location.lng;
        locationData = { lat, lng };
        console.log("✅ Location from geometry:", locationData);
      } else {
        console.log("⚠️ No geometry available, will geocode from address");
        // We'll geocode the address later if we have formatted_address
      }
      
      // Log all components for debugging
      console.log("🔍 Full place object from autocomplete:", fullPlace);
      console.log("🔍 Address components:", addressComponents.map(c => ({
        types: c.types,
        long_name: c.long_name,
        short_name: c.short_name
      })));
      
      // Initialize extracted values
      let extractedStreet = "";
      let extractedCity = "";
      let extractedPostcode = "";
      let extractedCountry = country;
      
      // Extract address components - loop through ALL components like signup page
      let streetNumber = "";
      let route = "";
      let neighborhood = "";
      let sublocality = "";
      let sublocalityLevel1 = "";
      let cityComp = null;
      let countryComponent = null;
      
      // Loop through all components to extract values (like signup page)
      for (const c of addressComponents) {
        const types = c.types || [];
        
        // Extract postal code - try multiple ways like signup page
        if (!extractedPostcode) {
          if (types.includes("postal_code")) {
            extractedPostcode = c.long_name || c.short_name || "";
          } else if (types.includes("postal_code_prefix")) {
            extractedPostcode = c.long_name || c.short_name || "";
          }
        }
        
        // Extract street components
        if (types.includes("street_number")) {
          streetNumber = c.long_name || "";
        }
        if (types.includes("route")) {
          route = c.long_name || "";
        }
        if (types.includes("neighborhood")) {
          neighborhood = c.long_name || "";
        }
        if (types.includes("sublocality")) {
          sublocality = c.long_name || "";
        }
        if (types.includes("sublocality_level_1")) {
          sublocalityLevel1 = c.long_name || "";
        }
        
        // Extract city - priority: locality > postal_town > administrative_area_level_2 > administrative_area_level_1 > sublocality
        if (!cityComp) {
          if (types.includes("locality")) {
            cityComp = c;
          } else if (types.includes("postal_town")) {
            cityComp = c;
          } else if (types.includes("administrative_area_level_2")) {
            cityComp = c;
          } else if (types.includes("administrative_area_level_1")) {
            cityComp = c;
          } else if (types.includes("sublocality") && !types.includes("sublocality_level")) {
            cityComp = c;
          }
        }
        
        // Extract country
        if (types.includes("country")) {
          countryComponent = c;
        }
      }
      
      // Build street address from available components
      if (streetNumber && route) {
        extractedStreet = `${streetNumber} ${route}`.trim();
      } else if (route) {
        extractedStreet = route;
      } else if (streetNumber) {
        extractedStreet = streetNumber;
      } else if (neighborhood) {
        extractedStreet = neighborhood;
      } else if (sublocality) {
        extractedStreet = sublocality;
      } else if (sublocalityLevel1) {
        extractedStreet = sublocalityLevel1;
      } else if (fullPlace.name && fullPlace.name !== fullPlace.formatted_address) {
        // Use place name if it's different from formatted address
        extractedStreet = fullPlace.name;
      } else if (fullPlace.formatted_address) {
        // Last resort: use first part of formatted address
        const parts = fullPlace.formatted_address.split(',');
        if (parts[0]) {
          extractedStreet = parts[0].trim();
        }
      }
      
      // Set city from component
      if (cityComp) {
        extractedCity = cityComp.long_name || "";
      } else {
        // Try to extract city from formatted address
        if (fullPlace.formatted_address) {
          const parts = fullPlace.formatted_address.split(',');
          // Usually city is one of the middle parts
          for (let i = 1; i < Math.min(parts.length, 4); i++) {
            const part = parts[i].trim();
            // Skip if it looks like a postcode or country
            const isPostcode = postalCodePatterns.some(pattern => pattern.test(part));
            const isCountry = countries.includes(part);
            if (part && !isPostcode && !isCountry && part.length > 2 && !part.match(/^\d+$/)) {
              extractedCity = part;
              break;
            }
          }
        }
      }
      
      // Set country from component
      if (countryComponent) {
        extractedCountry = countryComponent.long_name || country;
      }
      
      // Define postal code patterns with word boundaries (like signup page)
      const postalCodePatternsWithBoundaries = [
        /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i, // UK format
        /\b(\d{5}(?:-\d{4})?)\b/, // US format
        /\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i, // Canadian format
        /\b(\d{4,6})\b/, // Generic numeric (4-6 digits)
        /\b([A-Z]{1,2}\d{1,4})\b/i, // Generic alphanumeric
      ];
      
      // Fallback: Try to extract postcode from formatted address using regex (like signup page)
      if (!extractedPostcode && fullPlace.formatted_address) {
        for (const pattern of postalCodePatternsWithBoundaries) {
          const match = fullPlace.formatted_address.match(pattern);
          if (match && match[1]) {
            extractedPostcode = match[1].trim();
            console.log("✅ Postcode extracted from formatted address:", extractedPostcode);
            break;
          }
        }
      }
      
      // Special handling for street-only selections
      // If we have a street but no city/postcode, use formatted address as a fallback
      if (extractedStreet && (!extractedCity || !extractedPostcode)) {
        console.log("🔄 Street-only selection detected, using formatted address as fallback");
        
        if (fullPlace.formatted_address) {
          // Try to parse city from formatted address if not already found
          if (!extractedCity) {
            const parts = fullPlace.formatted_address.split(',');
            // Skip the first part (usually street) and last part (country)
            for (let i = 1; i < parts.length - 1; i++) {
              const part = parts[i].trim();
              const isPostcode = postalCodePatternsWithBoundaries.some(pattern => pattern.test(part));
              const isCountry = countries.includes(part);
              if (part && !isPostcode && !isCountry && part.length > 2 && !part.match(/^\d+$/)) {
                extractedCity = part;
                break;
              }
            }
          }
          
          // If still no city, use the formatted address itself as city
          if (!extractedCity && extractedStreet) {
            // Check if this is a well-known street (like "Oxford Street, London")
            if (fullPlace.formatted_address.includes(',') && !postalCodePatternsWithBoundaries.some(pattern => pattern.test(extractedStreet))) {
              const parts = fullPlace.formatted_address.split(',');
              // Use the part after the street as city
              for (let i = 1; i < parts.length; i++) {
                const part = parts[i].trim();
                const isPostcode = postalCodePatternsWithBoundaries.some(pattern => pattern.test(part));
                const isCountry = countries.includes(part);
                if (part && part.length > 2 && !isPostcode && !isCountry && !part.match(/^\d+$/)) {
                  extractedCity = part;
                  break;
                }
              }
            }
          }
        }
      }
      
      // If postal code is still missing but we have coordinates, try reverse geocoding (like signup page)
      if (!extractedPostcode && lat !== null && lng !== null && window.google?.maps && typeof window.google.maps.Geocoder === 'function') {
        console.log("🔄 Postal code missing, trying reverse geocoding...");
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: lat, lng: lng } }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
            const result = results[0];
            const resultComponents = result.address_components || [];
            
            for (const c of resultComponents) {
              const types = c.types || [];
              if (types.includes('postal_code')) {
                const foundPostalCode = c.long_name || c.short_name || '';
                if (foundPostalCode) {
                  console.log("✅ Found postal code via reverse geocoding:", foundPostalCode);
                  extractedPostcode = foundPostalCode;
                  setPostcode(foundPostalCode);
                  return;
                }
              }
            }
          }
        });
      }
      
      // Update all fields
      console.log("📋 Extracted values:", {
        street: extractedStreet || "(empty)",
        city: extractedCity || "(empty)",
        postcode: extractedPostcode || "(empty)",
        country: extractedCountry
      });
      
      // Update street address - always set it, even if empty (user cleared it)
      setStreetAddress(extractedStreet);
      
      // Update city - always set it (even if empty, to clear previous value)
      setCity(extractedCity);
      if (extractedCity) {
        setCityName(extractedCity);
      }
      
      // Update postcode - always set it (even if empty, to clear previous value)
      setPostcode(extractedPostcode);
      
      // Update country if different
      if (extractedCountry !== country) {
        setCountry(extractedCountry);
      }
      
      // If we don't have location data, try to geocode from formatted address
      if (!locationData && fullPlace.formatted_address) {
        console.log("🔄 Geocoding address from formatted_address:", fullPlace.formatted_address);
        const geocodeSuccess = await geocodeAndUpdateMap(fullPlace.formatted_address, false);
        if (geocodeSuccess) {
          // geocodeAndUpdateMap will update location and coords
          // Get the updated location from state (it will be set by geocodeAndUpdateMap)
          // But we already have the extracted values, so just continue
        } else {
          // If geocoding fails, still update the fields we extracted
          setLocation(null);
          setCoords(null);
        }
      } else {
        // Set location and coordinates
        setLocation(locationData);
        setCoords(locationData);
      }
      
      // Set selected area
      if (fullPlace.formatted_address) {
        setSelectedArea(fullPlace.formatted_address);
      }
      
      // Clear any errors
      setError("");
      
      // Calculate ETA if we have coordinates
      if (lat && lng) {
        calculateETA(lat, lng);
      } else if (locationData && locationData.lat && locationData.lng) {
        calculateETA(locationData.lat, locationData.lng);
      }
      
      // Reset flag after a delay
      setTimeout(() => {
        placeSelectedRef.current = false;
      }, 1000);
      
    } catch (error) {
      console.error("❌ Error processing selected place:", error);
      setError("An error occurred while processing the selected address. Please try again.");
      placeSelectedRef.current = false;
    }
  };

  const handleSaveLocation = async ({ postcode, lat, lng, city }) => {
    console.log("Saved location:", { postcode, lat, lng, city });
    setPostcode(postcode);
    setCoords(lat && lng ? { lat, lng } : null);

    localStorage.setItem("postcode", postcode);
    if (lat && lng) {
      localStorage.setItem("lat", lat.toString());
      localStorage.setItem("lng", lng.toString());
      // Mark that user has explicitly set their location
      localStorage.setItem("userLocationSet", "true");
    } else {
      localStorage.removeItem("lat");
      localStorage.removeItem("lng");
      localStorage.removeItem("userLocationSet");
    }
    
    // Store city name if provided
    const finalCity = city || cityName || "";
    if (finalCity) {
      localStorage.setItem("city", finalCity);
      console.log("💾 Saved city to localStorage in handleSaveLocation:", finalCity);
    } else {
      // Try to extract city from postcode if it's not a postal code format
      const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
      if (postcode && !postalCodePattern.test(postcode.trim())) {
        // If postcode contains comma, extract first part as city
        const parts = postcode.split(',');
        const extractedCity = parts[0].trim();
        if (extractedCity) {
          localStorage.setItem("city", extractedCity);
          console.log("💾 Extracted and saved city from postcode:", extractedCity);
        }
      }
    }
    
    // Save address to database as default if user is authenticated
    if (token) {
      try {
        // Prepare address data - use the same structure as DeliveryDetails
        const addressData = {
          address_line_1: streetAddress || postcode || finalCity || "Address",
          city: finalCity || city || "",
          postal_code: postcode || "",
          country: country || "United Kingdom",
          state: null, // State is optional for API
          type: 'shipping',
          latitude: lat || null,
          longitude: lng || null,
        };
        
        // Only save if we have minimum required fields
        if (addressData.address_line_1 && addressData.city && addressData.postal_code) {
          console.log('💾 Saving address to database as default:', addressData);
          
          // Create the address
          const response = await createAddress('/addresses', addressData, true);
          
          if (response?.data) {
            // Extract address ID - handle different response structures
            const addressId = response.data.id || 
                             (response.data.data && response.data.data.id) ||
                             (response.data.address && response.data.address.id);
            
            console.log('📝 Created address with ID:', addressId);
            
            // Set as default address
            if (addressId) {
              try {
                await setDefaultAddress(`/addresses/${addressId}/set-default`, {}, true);
                console.log('✅ Address saved and set as default');
              } catch (err) {
                console.warn('⚠️ Failed to set address as default:', err);
                // Address was created but setting as default failed - that's okay
              }
            } else {
              console.warn('⚠️ Address created but could not extract ID from response:', response.data);
            }
          }
        } else {
          console.log('⚠️ Skipping address save - missing required fields:', {
            hasAddress: !!addressData.address_line_1,
            hasCity: !!addressData.city,
            hasPostcode: !!addressData.postal_code
          });
        }
      } catch (error) {
        console.error('❌ Error saving address to database:', error);
        // Don't block the location save if address save fails
        // User can still use the location even if saving to DB fails
      }
    }
    
    // Dispatch event to trigger store and product refresh
    // Use a small delay to ensure localStorage is updated first
    setTimeout(() => {
      const locationData = { lat, lng, city: finalCity, postcode };
      console.log('📡 Dispatching locationUpdated event:', locationData);
      
      // Create and dispatch the event
      const event = new CustomEvent('locationUpdated', {
        detail: locationData,
        bubbles: true,
        cancelable: true
      });
      
      // Dispatch to both window and document for maximum compatibility
      window.dispatchEvent(event);
      document.dispatchEvent(event);
      
      console.log('✅ Location updated event dispatched - stores and products will refresh');
    }, 150); // Slightly longer delay to ensure localStorage is fully updated
    
    onSave(postcode);
    onClose();
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const locationData = { lat: latitude, lng: longitude };
          setLocation(locationData);
          setCoords(locationData);
          
          // Calculate ETA
          calculateETA(latitude, longitude);

          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_MAP_KEY}`
            );
            const data = await res.json();
            if (data.results.length > 0) {
              const place = data.results[0];
              const components = place.address_components || [];
              
              // Loop through all components to extract values (like signup page)
              let postalCode = "";
              let cityComp = null;
              let streetNumber = "";
              let route = "";
              
              for (const c of components) {
                const types = c.types || [];
                
                // Extract postal code - try multiple ways like signup page
                // Use long_name first, then short_name (matching signup page exactly)
                if (!postalCode) {
                  if (types.includes("postal_code")) {
                    postalCode = c.long_name || c.short_name || "";
                  } else if (types.includes("postal_code_prefix")) {
                    postalCode = c.long_name || c.short_name || "";
                  }
                }
                
                // Extract city
                if (!cityComp) {
                  if (types.includes("locality")) {
                    cityComp = c;
                  } else if (types.includes("postal_town")) {
                    cityComp = c;
                  } else if (types.includes("administrative_area_level_2")) {
                    cityComp = c;
                  }
                }
                
                // Extract street components
                if (types.includes("street_number")) {
                  streetNumber = c.long_name || "";
                }
                if (types.includes("route")) {
                  route = c.long_name || "";
                }
              }
              
              if (postalCode) setPostcode(postalCode);
              if (cityComp) setCity(cityComp.long_name);
              if (streetNumber || route) setStreetAddress(`${streetNumber} ${route}`.trim());
              setSelectedArea(place.formatted_address || "Not set");
              setError("");
            }
          } catch (err) {
            setError("Error fetching location details.");
          }
        },
        () => {
          setError("Location access denied. Please enter your address manually.");
        }
      );
    } else {
      setError("Geolocation is not supported.");
    }
  };

  const handleReset = () => {
    setStreetAddress("");
    setCity("");
    setPostcode("");
    setLocation(null);
    setCoords(null);
    setSelectedArea("Not set");
    setEta("—");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Determine the value to use based on input mode
    let postcodeValue = "";
    let finalCity = cityName || city || "";
    
    if (inputMode === "postcode") {
      // In postcode mode, use postcode field
      postcodeValue = postcode.trim();
      if (!postcodeValue) {
        setError("Please enter a postcode");
        return;
      }
    } else {
      // In address mode, prioritize: postcode > full address > city
      if (postcode.trim()) {
        postcodeValue = postcode.trim();
      } else if (streetAddress.trim()) {
        // Build full address from components
        const addressParts = [streetAddress.trim()];
        if (city.trim()) addressParts.push(city.trim());
        if (country && country !== "United Kingdom") addressParts.push(country);
        postcodeValue = addressParts.join(", ");
        finalCity = city.trim() || cityName || "";
      } else if (city.trim()) {
        postcodeValue = city.trim();
        finalCity = city.trim();
      } else {
        setError("Please enter an address or postcode");
        return;
      }
    }
    
    // Extract city if not already set
    if (!finalCity && postcodeValue) {
      // Try to extract city from postcode if it contains comma (e.g., "England, UK")
      const parts = postcodeValue.split(',');
      if (parts.length > 1) {
        finalCity = parts[0].trim();
      } else {
        // Check if it's not a postal code format, treat as city name
        const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
        if (!postalCodePattern.test(postcodeValue)) {
          finalCity = postcodeValue;
        }
      }
    }
    
    // If we have coordinates from autocomplete or geocoding, use them
    if (coords && coords.lat && coords.lng) {
      handleSaveLocation({
        postcode: postcodeValue,
        lat: coords.lat,
        lng: coords.lng,
        city: finalCity,
      });
    } else if (location && location.lat && location.lng) {
      handleSaveLocation({
        postcode: postcodeValue,
        lat: location.lat,
        lng: location.lng,
        city: finalCity,
      });
    } else {
      // No coordinates, try to geocode the address/postcode/city
      setError("Geocoding location...");
      try {
        const { getLatLngFromPostcode } = await import('@/controller/getLatLngFromPostcode');
        // Check if it's a UK postcode format
        const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
        const isUKPostcode = postalCodePattern.test(postcodeValue);
        // For city names, don't restrict to UK - let geocoding API find it globally
        const geocodeResult = await getLatLngFromPostcode(postcodeValue, isUKPostcode ? 'UK' : null);
        
        if (geocodeResult && geocodeResult.lat && geocodeResult.lng) {
          setError("");
          // Use city from geocoding result if available, otherwise use extracted city
          const geocodedCity = geocodeResult.city || finalCity || postcodeValue;
          if (geocodeResult.city) {
            setCityName(geocodeResult.city);
            setCity(geocodeResult.city);
            console.log("✅ City extracted from geocoding:", geocodeResult.city);
          } else if (finalCity) {
            setCityName(finalCity);
          }
          // Update map location
          const locationData = { lat: geocodeResult.lat, lng: geocodeResult.lng };
          setLocation(locationData);
          setCoords(locationData);
          setSelectedArea(geocodeResult.formatted_address || postcodeValue || "Not set");
          
          // Calculate ETA
          calculateETA(geocodeResult.lat, geocodeResult.lng);
          
          handleSaveLocation({
            postcode: postcodeValue,
            lat: geocodeResult.lat,
            lng: geocodeResult.lng,
            city: geocodedCity,
          });
        } else {
          // If geocoding fails but we have a city name, still save it for city-based filtering
          const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
          if (finalCity || !postalCodePattern.test(postcodeValue)) {
            setError("");
            console.log("⚠️ No coordinates found, but saving city name for city-based filtering:", finalCity || postcodeValue);
            handleSaveLocation({
              postcode: postcodeValue,
              lat: null,
              lng: null,
              city: finalCity || postcodeValue,
            });
          } else {
            setError("Could not find coordinates for this location. Please select from suggestions or try another address.");
            // Still save the postcode even if geocoding fails
            handleSaveLocation({
              postcode: postcodeValue,
              lat: null,
              lng: null,
              city: finalCity,
            });
          }
        }
      } catch (err) {
        console.error("Error geocoding location:", err);
        // If it looks like a city name (not a postcode), still save it for city-based filtering
        const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
        if (finalCity || !postalCodePattern.test(postcodeValue)) {
          setError("");
          console.log("⚠️ Geocoding error, but saving city name for city-based filtering:", finalCity || postcodeValue);
          handleSaveLocation({
            postcode: postcodeValue,
            lat: null,
            lng: null,
            city: finalCity || postcodeValue,
          });
        } else {
          setError("Error geocoding location. Please try selecting from suggestions.");
          // Still save the postcode even if geocoding fails
          handleSaveLocation({
            postcode: postcodeValue,
            lat: null,
            lng: null,
            city: finalCity,
          });
        }
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 flex justify-center items-center z-50 p-2 sm:p-4 animate-fadeIn"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div 
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-slideUp mx-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute cursor-pointer rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-xl sm:text-2xl font-normal z-10 transition-colors"
          aria-label="Close"
        >
          ×
        </button>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 hide-scrollbar">

          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Deliver to</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Panel - Form */}
            <div className="space-y-4">
              <form onSubmit={handleSubmit}>
                {/* Input Mode Toggle */}
                <div className="flex gap-2 mb-3 sm:mb-4">
                  <button
                    type="button"
                    onClick={() => setInputMode("address")}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-colors ${
                      inputMode === "address"
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                  >
                    Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode("postcode")}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base font-medium transition-colors ${
                      inputMode === "postcode"
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                  >
                    Postcode / ZIP
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-100 text-red-600 text-xs sm:text-sm p-2 sm:p-3 rounded mb-3 sm:mb-4">
                    {error}
                  </div>
                )}

                {/* Country Field */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      
                      // Don't clear fields if a place was just selected (programmatic country update)
                      // Check flag FIRST before doing anything
                      if (placeSelectedRef.current) {
                        console.log("🛡️ Country onChange blocked - place selection in progress");
                        setCountry(newCountry);
                        // Reset autocomplete when country changes to apply new restriction
                        if (autocompleteRef.current && autocompleteRef.current.setComponentRestrictions) {
                          const countryCode = getCountryCode(newCountry);
                          if (countryCode) {
                            autocompleteRef.current.setComponentRestrictions({ country: countryCode });
                          }
                        }
                        return;
                      }
                      
                      // Only clear fields if user manually changed country (not from place selection)
                      setCountry(newCountry);
                      
                      // Clear address fields when country changes to prevent mismatches
                      setStreetAddress("");
                      setCity("");
                      setPostcode("");
                      setLocation(null);
                      setCoords(null);
                      setSelectedArea("Not set");
                      setEta("—");
                      setError("");
                      
                      // Reset autocomplete when country changes to apply new restriction
                      if (autocompleteRef.current && autocompleteRef.current.setComponentRestrictions) {
                        const countryCode = getCountryCode(newCountry);
                        if (countryCode) {
                          autocompleteRef.current.setComponentRestrictions({ country: countryCode });
                        }
                      }
                    }}
                    className="w-full border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                  >
                    {countries.map((countryName) => (
                      <option key={countryName} value={countryName}>
                        {countryName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address Mode Fields */}
                {inputMode === "address" ? (
                  <>
                    {/* Street Address */}
                    <div className="mb-3 sm:mb-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Street address
                      </label>
                      {isLoaded && apiKey ? (
                        <Autocomplete
                          key={`street-${country}`} // Force re-render when country changes
                          onLoad={(autocomplete) => {
                            console.log("✅ Street autocomplete loaded");
                            setAutocomplete(autocomplete);
                            autocompleteRef.current = autocomplete;
                            // Set country restriction when autocomplete loads
                            const countryCode = getCountryCode(country);
                            if (countryCode && autocomplete.setComponentRestrictions) {
                              autocomplete.setComponentRestrictions({ country: countryCode });
                            }
                          }}
                          onPlaceChanged={() => {
                            console.log("📍 Street address place changed");
                            onPlaceChanged();
                          }}
                          options={{
                            fields: ["geometry", "formatted_address", "address_components", "name", "place_id", "types"],
                            componentRestrictions: getCountryCode(country) ? { country: getCountryCode(country) } : undefined,
                            types: ['address'], // Restrict to addresses only
                          }}
                        >
                          <input
                            ref={streetInputRef}
                            type="text"
                            value={streetAddress}
                            onChange={(e) => {
                              setStreetAddress(e.target.value);
                              // Clear location when user manually types to force re-geocoding
                              setLocation(null);
                              setCoords(null);
                              setSelectedArea("Not set");
                              setEta("—");
                            }}
                            onBlur={async () => {
                              // When user finishes typing street address, geocode if we have enough info
                              // Only geocode if location is not set (meaning autocomplete didn't handle it)
                              // Don't geocode on very short inputs (minimum 3 characters)
                              if (streetAddress.trim().length >= 3 && !location && isLoaded && apiKey && !placeSelectedRef.current) {
                                let addressToGeocode = streetAddress.trim();
                                if (city.trim()) {
                                  addressToGeocode = `${addressToGeocode}, ${city.trim()}, ${country}`;
                                } else {
                                  addressToGeocode = `${addressToGeocode}, ${country}`;
                                }
                                console.log("🔄 Geocoding on blur (manual entry):", addressToGeocode);
                                await geocodeAndUpdateMap(addressToGeocode, true);
                              }
                            }}
                            className="w-full border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="221B Baker Street"
                          />
                        </Autocomplete>
                      ) : (
                        <input
                          type="text"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="221B Baker Street"
                        />
                      )}
                    </div>

                    {/* City */}
                    <div className="mb-3 sm:mb-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          // Clear location when user manually types
                          if (e.target.value !== city) {
                            setLocation(null);
                            setCoords(null);
                            setSelectedArea("Not set");
                            setEta("—");
                          }
                        }}
                        onBlur={async () => {
                          // When user finishes typing city, validate if street address is also filled
                          if (streetAddress.trim() && city.trim() && !location) {
                            const fullAddress = `${streetAddress.trim()}, ${city.trim()}, ${country}`;
                            await geocodeAndUpdateMap(fullAddress, true);
                          }
                        }}
                        className="w-full border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="London"
                      />
                    </div>

                    {/* Postcode */}
                    <div className="mb-3 sm:mb-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Postcode / ZIP
                      </label>
                      {isLoaded && apiKey ? (
                        <Autocomplete
                          key={`postcode-addr-${country}`} // Force re-render when country changes
                          onLoad={(autocomplete) => {
                            console.log("✅ Postcode (address mode) autocomplete loaded");
                            setAutocomplete(autocomplete);
                            autocompleteRef.current = autocomplete;
                            // Set country restriction when autocomplete loads
                            const countryCode = getCountryCode(country);
                            if (countryCode && autocomplete.setComponentRestrictions) {
                              autocomplete.setComponentRestrictions({ country: countryCode });
                            }
                          }}
                          onPlaceChanged={() => {
                            console.log("📍 Postcode (address mode) place changed");
                            onPlaceChanged();
                          }}
                          options={{
                            fields: ["geometry", "formatted_address", "address_components", "name", "place_id"],
                            componentRestrictions: getCountryCode(country) ? { country: getCountryCode(country) } : undefined,
                          }}
                        >
                          <input
                            type="text"
                            value={postcode}
                            onChange={(e) => {
                              setPostcode(e.target.value);
                              // Clear location when user manually types
                              if (e.target.value !== postcode) {
                                setLocation(null);
                                setCoords(null);
                                setSelectedArea("Not set");
                                setEta("—");
                              }
                            }}
                            onBlur={async () => {
                              // When user finishes typing postcode, validate it
                              if (postcode.trim() && !location) {
                                await geocodeAndUpdateMap(postcode, true);
                              }
                            }}
                            className="w-full border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="SW1A 1AA"
                          />
                        </Autocomplete>
                      ) : (
                        <input
                          type="text"
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="SW1A 1AA"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  /* Postcode Mode */
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Postcode / ZIP
                    </label>
                    {isLoaded && apiKey ? (
                      <Autocomplete
                        key={`postcode-mode-${country}`} // Force re-render when country changes
                        onLoad={(autocomplete) => {
                          console.log("✅ Postcode (postcode mode) autocomplete loaded");
                          setAutocomplete(autocomplete);
                          autocompleteRef.current = autocomplete;
                          // Set country restriction when autocomplete loads
                          const countryCode = getCountryCode(country);
                          if (countryCode && autocomplete.setComponentRestrictions) {
                            autocomplete.setComponentRestrictions({ country: countryCode });
                          }
                        }}
                        onPlaceChanged={() => {
                          console.log("📍 Postcode (postcode mode) place changed");
                          onPlaceChanged();
                        }}
                        options={{
                          fields: ["geometry", "formatted_address", "address_components", "name", "place_id"],
                          componentRestrictions: getCountryCode(country) ? { country: getCountryCode(country) } : undefined,
                        }}
                      >
                        <input
                          type="text"
                          value={postcode}
                          onChange={(e) => {
                            setPostcode(e.target.value);
                            if (e.target.value !== postcode) {
                              setLocation(null);
                              setCoords(null);
                              setSelectedArea("Not set");
                              setEta("—");
                            }
                          }}
                          onBlur={async () => {
                            // When user finishes typing postcode, validate it
                            const currentPostcode = postcode.trim();
                            if (currentPostcode && !location) {
                              await geocodeAndUpdateMap(currentPostcode, true);
                            }
                          }}
                          className="w-full border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter postcode (e.g. SW1A 1AA)"
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        type="text"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter postcode (e.g. SW1A 1AA)"
                      />
                    )}
                  </div>
                )}

                {/* Use my location button */}
                <button
                  type="button"
                  onClick={handleUseLocation}
                  className="w-full text-orange-500 bg-white border border-gray-300 rounded-md px-3 sm:px-4 py-1.5 sm:py-2 mb-3 sm:mb-4 text-sm sm:text-base hover:bg-gray-50 transition-colors"
                >
                  Use my location
                </button>

                {/* Suggested Postcodes */}
                {inputMode === "postcode" && (
                  <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                    {suggestedPostcodes.map((suggested) => (
                      <button
                        key={suggested}
                        type="button"
                        onClick={async () => {
                          setPostcode(suggested);
                          setInputMode("postcode");
                          // Geocode and show on map
                          await geocodeAndUpdateMap(suggested);
                        }}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-300 rounded-md text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {suggested}
                      </button>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white rounded-md px-3 sm:px-4 py-2 text-sm sm:text-base font-medium hover:bg-orange-600 transition-colors"
                  >
                    Save location
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 bg-white text-orange-500 border border-orange-500 rounded-md px-3 sm:px-4 py-2 text-sm sm:text-base font-medium hover:bg-orange-50 transition-colors"
                  >
                    Reset
                  </button>
                </div>

                {/* Helper Text */}
                <p className="text-xs sm:text-sm text-gray-500">
                  We'll show stores and delivery times for your area.
                </p>
              </form>
            </div>

            {/* Right Panel - Information Display */}
            <div className="space-y-3 sm:space-y-4 mt-4 md:mt-0">
              {/* Map/Visual Area */}
              <div className="w-full h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                {location && isLoaded && apiKey ? (
                  <GoogleMapController
                    center={location}
                    zoom={15}
                    marker
                    className="w-full h-full"
                    fallback={
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-400 text-sm">Map loading...</p>
                      </div>
                    }
                  />
                ) : coords && isLoaded && apiKey ? (
                  <GoogleMapController
                    center={coords}
                    zoom={15}
                    marker
                    className="w-full h-full"
                    fallback={
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <p className="text-gray-400 text-sm">Map loading...</p>
                      </div>
                    }
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">Select an address to see it on the map</p>
                  </div>
                )}
              </div>

              {/* Selected area */}
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Selected area</p>
                <p className="text-xs sm:text-sm text-gray-500 break-words">{selectedArea}</p>
              </div>

              {/* ETA */}
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">ETA</p>
                <p className="text-xs sm:text-sm text-gray-500">{eta}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced styling for Google Maps autocomplete suggestions */}
        {isLoaded && apiKey && (
          <style jsx global>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { 
                opacity: 0;
                transform: translateY(20px);
              }
              to { 
                opacity: 1;
                transform: translateY(0);
              }
            }
            .hide-scrollbar {
              -ms-overflow-style: none;  /* IE and Edge */
              scrollbar-width: none;  /* Firefox */
            }
            .hide-scrollbar::-webkit-scrollbar {
              display: none;  /* Chrome, Safari and Opera */
            }
            .pac-container {
              border-radius: 8px;
              border: 1px solid #d1d5db;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              margin-top: 4px;
              z-index: 10000 !important;
              font-family: inherit;
              background: white;
            }
            .pac-item {
              padding: 10px 12px;
              cursor: pointer;
              border-bottom: 1px solid #e5e7eb;
              transition: background-color 0.2s;
            }
            .pac-item:last-child {
              border-bottom: none;
            }
            .pac-item:hover {
              background-color: #f3f4f6;
            }
            .pac-item-selected,
            .pac-item-selected:hover {
              background-color: #fef2f2;
            }
            .pac-item-query {
              color: #111827;
              font-size: 14px;
              font-weight: 500;
              padding-right: 3px;
            }
            .pac-matched {
              font-weight: 600;
              color: #dc2626;
            }
            .pac-icon {
              width: 15px;
              height: 20px;
              margin-right: 6px;
            }
            .pac-item-query .pac-icon {
              background-color: #4285f4;
              mask-image: url(https://maps.gstatic.com/mapfiles/api-3/images/icon_autocomplete.png);
              -webkit-mask-image: url(https://maps.gstatic.com/mapfiles/api-3/images/icon_autocomplete.png);
            }
          `}</style>
        )}
      </div>
    </div>
  );
}