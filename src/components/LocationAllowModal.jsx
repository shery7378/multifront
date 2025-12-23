// src/components/LocationAllowModal.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import GoogleMapController from "@/controller/GoogleMapController";

const libraries = ["places"];

export default function LocationAllowModal({ isOpen, onClose, onSave }) {
  const [postcode, setPostcode] = useState("");
  const [location, setLocation] = useState(null); // { lat, lng }
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null);
  const [cityName, setCityName] = useState(null); // Store extracted city name
  const [autocomplete, setAutocomplete] = useState(null);
  const autocompleteRef = useRef(null);

  // Load Google Maps API with Places library
  // Use the same script ID as other components to share the loaded script
  const apiKey = process.env.NEXT_PUBLIC_MAP_KEY || "";
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script", // Use same ID to share loaded script
    googleMapsApiKey: apiKey,
    libraries: libraries,
    version: "weekly",
  });

  // Log API key status (always log to help debug)
  useEffect(() => {
    console.log('🔑 [LocationModal] Google Maps API Key Status:', {
      hasKey: !!apiKey,
      keyLength: apiKey.length,
      keyPreview: apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT SET',
      fullKey: apiKey, // Log full key for debugging (remove in production)
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
    setPostcode("");
    setError("");
    setLocation(null);
    setCoords(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ lat: latitude, lng: longitude });

          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_MAP_KEY}`
            );
            const data = await res.json();
            if (data.results.length > 0) {
              const postalComp = data.results[0].address_components.find((c) =>
                c.types.includes("postal_code")
              );
              if (postalComp) {
                setPostcode(postalComp.long_name);
              } else {
                setError("Couldn't detect postal code automatically. Please enter manually.");
              }
            } else {
              setError("Couldn't detect your location details. Please enter manually.");
            }
          } catch (err) {
            setError("Error fetching postal code. Please enter manually.");
          }
        },
        () => {
          setError("Location access denied. Please enter your postal code manually.");
        }
      );
    } else {
      setError("Geolocation is not supported. Please enter postal code manually.");
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
  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        console.warn("⚠️ Selected place has no geometry");
        setError("Selected location is invalid. Please try another address.");
        return;
      }
      
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const locationData = { lat, lng };
      
      // Update location and coordinates
      setLocation(locationData);
      setCoords(locationData);
      
      // Extract postcode from address components
      const postalComponent = place.address_components?.find((component) =>
        component.types.includes("postal_code")
      );
      
      // Extract city/area for better display
      // Try multiple address component types to find city name
      const cityComponent = place.address_components?.find((component) =>
        component.types.includes("locality") || 
        component.types.includes("administrative_area_level_2") ||
        component.types.includes("administrative_area_level_1") ||
        component.types.includes("sublocality")
      );
      
      // Extract country component
      const countryComponent = place.address_components?.find((component) =>
        component.types.includes("country")
      );
      
      // Extract city name - prefer locality, then administrative_area_level_2, then extract from formatted address
      let cityName = cityComponent?.long_name || null;
      
      // If no city component found, try to extract from formatted address
      // For "England, UK" -> extract "England"
      if (!cityName && place.formatted_address) {
        const parts = place.formatted_address.split(',');
        if (parts.length > 0) {
          // Take the first part (before first comma) as city name
          cityName = parts[0].trim();
        }
      }
      
      // Fallback to place name if still no city
      if (!cityName) {
        cityName = place.name || "";
      }
      
      // Use postcode if available, otherwise use city name or formatted address
      let postcodeValue = postalComponent?.long_name;
      if (!postcodeValue) {
        // If no postcode, use city name (not full formatted address)
        postcodeValue = cityName || place.formatted_address || place.name || "";
      }
      
      setPostcode(postcodeValue);
      setCityName(cityName); // Store in state for later use
      
      // Store city name separately in localStorage for API filtering
      if (cityName) {
        localStorage.setItem("city", cityName);
        console.log("💾 Saved city to localStorage:", cityName);
      }
      
      // Clear any previous errors
      setError("");
      
      console.log("✅ Place selected from autocomplete:", {
        formatted_address: place.formatted_address,
        postcode: postalComponent?.long_name,
        city: cityName,
        city_component: cityComponent?.long_name,
        country: countryComponent?.long_name,
        lat,
        lng,
        address_components: place.address_components?.map(c => ({
          types: c.types,
          long_name: c.long_name,
          short_name: c.short_name
        }))
      });
    }
  };

  const handleSaveLocation = ({ postcode, lat, lng, city }) => {
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
    if (city) {
      localStorage.setItem("city", city);
      console.log("💾 Saved city to localStorage in handleSaveLocation:", city);
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
    
    // Dispatch event to trigger store refresh
    // Use a small delay to ensure localStorage is updated first
    setTimeout(() => {
      console.log('📡 Dispatching locationUpdated event:', { lat, lng, city, postcode });
      const event = new CustomEvent('locationUpdated', {
        detail: { lat, lng, city, postcode },
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(event);
      // Also try document for better compatibility
      document.dispatchEvent(event);
      console.log('✅ Event dispatched to both window and document');
    }, 100);
    
    onSave(postcode);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const postcodeValue = postcode.trim();
    if (!postcodeValue) return alert("Please enter an address or postcode");
    
    // Get city name from state or extract from postcode
    let city = cityName;
    if (!city && postcodeValue) {
      // Try to extract city from postcode if it contains comma (e.g., "England, UK")
      const parts = postcodeValue.split(',');
      if (parts.length > 1) {
        city = parts[0].trim();
      } else {
        // Check if it's not a postal code format, treat as city name
        const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
        if (!postalCodePattern.test(postcodeValue)) {
          city = postcodeValue;
        }
      }
    }
    
    // If we have coordinates from autocomplete, use them
    if (coords && coords.lat && coords.lng) {
      handleSaveLocation({
        postcode: postcodeValue,
        lat: coords.lat,
        lng: coords.lng,
        city: city,
      });
    } else if (location && location.lat && location.lng) {
      handleSaveLocation({
        postcode: postcodeValue,
        lat: location.lat,
        lng: location.lng,
        city: city,
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
          const finalCity = geocodeResult.city || city || postcodeValue;
          if (geocodeResult.city) {
            setCityName(geocodeResult.city);
            console.log("✅ City extracted from geocoding:", geocodeResult.city);
          } else if (city) {
            setCityName(city);
          }
          handleSaveLocation({
            postcode: postcodeValue,
            lat: geocodeResult.lat,
            lng: geocodeResult.lng,
            city: finalCity,
          });
        } else {
          // If geocoding fails but we have a city name, still save it for city-based filtering
          if (city || !postalCodePattern.test(postcodeValue)) {
            setError("");
            console.log("⚠️ No coordinates found, but saving city name for city-based filtering:", city || postcodeValue);
            handleSaveLocation({
              postcode: postcodeValue,
              lat: null,
              lng: null,
              city: city || postcodeValue,
            });
          } else {
            setError("Could not find coordinates for this location. Please select from suggestions or try another address.");
            // Still save the postcode even if geocoding fails
            handleSaveLocation({
              postcode: postcodeValue,
              lat: null,
              lng: null,
              city: city,
            });
          }
        }
      } catch (err) {
        console.error("Error geocoding location:", err);
        // If it looks like a city name (not a postcode), still save it for city-based filtering
        const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
        if (city || !postalCodePattern.test(postcodeValue)) {
          setError("");
          console.log("⚠️ Geocoding error, but saving city name for city-based filtering:", city || postcodeValue);
          handleSaveLocation({
            postcode: postcodeValue,
            lat: null,
            lng: null,
            city: city || postcodeValue,
          });
        } else {
          setError("Error geocoding location. Please try selecting from suggestions.");
          // Still save the postcode even if geocoding fails
          handleSaveLocation({
            postcode: postcodeValue,
            lat: null,
            lng: null,
            city: city,
          });
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="relative bg-white p-6 rounded shadow-lg w-[400px] max-w-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute cursor-pointer rounded-full border w-7 h-7 flex items-center justify-center top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4">Allow Your Location</h2>
        <form onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-2">
              {error}
            </div>
          )}

          {/* Map / Fallback */}
          <div className="mt-3 mb-4 relative">
            {location && isLoaded ? (
              <GoogleMapController
                center={location}
                zoom={15}
                marker
                className="w-full h-48 rounded-lg overflow-hidden border border-gray-200"
                fallback={
                  <img
                    src="/modal-map.png"
                    alt="map"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                }
              />
            ) : (
              <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                {isLoaded ? (
                  <p className="text-gray-500 text-sm">Select an address to see it on the map</p>
                ) : (
                  <img
                    src="/modal-map.png"
                    alt="map"
                    className="w-full h-48 object-cover"
                  />
                )}
              </div>
            )}
          </div>

          <div className="mb-1">
            <small>Skip the typing and see stores near you</small>
          </div>

          {/* Google Places Autocomplete */}
          {isLoaded && apiKey ? (
            <div className="relative mb-4">
              <Autocomplete
                onLoad={(autocomplete) => {
                  setAutocomplete(autocomplete);
                  autocompleteRef.current = autocomplete;
                  // Set bounds to improve results (optional - can be removed for global search)
                  // autocomplete.setBounds(new window.google.maps.LatLngBounds(
                  //   new window.google.maps.LatLng(49.0, -10.0),
                  //   new window.google.maps.LatLng(61.0, 2.0)
                  // ));
                }}
                onPlaceChanged={onPlaceChanged}
                options={{
                  // Note: "address" cannot be mixed with other types in Google Places API
                  // "geocode" includes addresses, so we use that instead
                  // Remove types entirely to allow all place types, or specify allowed types
                  // types: ["geocode", "establishment"], // This allows addresses (via geocode) and businesses
                  fields: ["geometry", "formatted_address", "address_components", "name", "place_id"],
                  // Remove country restrictions to allow all countries
                  // componentRestrictions: { country: ["uk", "us", "ca", "au"] },
                }}
              >
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => {
                    setPostcode(e.target.value);
                    // Clear location when user types manually
                    if (e.target.value !== postcode) {
                      setLocation(null);
                      setCoords(null);
                    }
                  }}
                  className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-vivid-red focus:border-transparent"
                  placeholder="Enter address or postcode (e.g. SW1A 1AA or 123 Main St)"
                  style={{
                    padding: "8px 12px",
                    width: "100%",
                  }}
                />
              </Autocomplete>
              {/* Enhanced styling for Google Maps autocomplete suggestions */}
              <style jsx global>{`
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
            </div>
          ) : loadError ? (
            <div className="mb-4">
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="border p-2 w-full rounded"
                placeholder="Enter address or postcode (e.g. SW1A 1AA)"
              />
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-600 font-semibold mb-1">⚠️ Google Maps API Error</p>
                <p className="text-xs text-red-500">{loadError.message || "Failed to load Google Maps API"}</p>
                <p className="text-xs text-gray-600 mt-2">
                  Please check:
                  <br />• API key is set in NEXT_PUBLIC_MAP_KEY
                  <br />• Places API is enabled in Google Cloud Console
                  <br />• Billing is enabled for your Google Cloud project
                  <br />• API key restrictions allow your domain
                </p>
              </div>
            </div>
          ) : !apiKey ? (
            <div className="mb-4">
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="border p-2 w-full rounded"
                placeholder="Enter address or postcode (e.g. SW1A 1AA)"
              />
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800 font-semibold mb-1">⚠️ API Key Missing</p>
                <p className="text-xs text-yellow-700">
                  Google Maps API key is not configured. Please set NEXT_PUBLIC_MAP_KEY in your .env file.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                className="border p-2 w-full rounded"
                placeholder="Loading autocomplete..."
                disabled
              />
            </div>
          )}

          <div className="flex justify-center space-x-2">
            <button
              type="submit"
              className="px-4 cursor-pointer py-2 w-full bg-vivid-red text-white rounded"
            >
              Allow
            </button>
          </div>

          <div className="flex justify-center mt-2">
            <span className="text-center text-sm text-gray-600">
              Type in delivery address instead
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
