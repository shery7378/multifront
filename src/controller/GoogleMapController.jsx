//src/controller/GoogleMapController.jsx
"use client";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export default function GoogleMapController({
    center = { lat: 0, lng: 0 },
    zoom = 14,
    marker = true,
    options = {},
    className = "w-full h-64",
    style = { width: "100%", height: "100%" },
    fallback = null,
}) {
    const apiKey = process.env.NEXT_PUBLIC_MAP_KEY || "";
    
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: apiKey,
        libraries: ["places"], // Add places library for consistency
        version: "weekly",
    });

    if (!apiKey) {
        return fallback || (
            <div className={`bg-yellow-50 border border-yellow-200 flex items-center justify-center ${className} p-4`}>
                <p className="text-xs text-yellow-800 text-center">
                    Google Maps API key not configured
                </p>
            </div>
        );
    }

    if (loadError) {
        return fallback || (
            <div className={`bg-red-50 border border-red-200 flex items-center justify-center ${className} p-4`}>
                <p className="text-xs text-red-600 text-center">
                    Failed to load Google Maps: {loadError.message}
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return fallback || (
            <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
                <p className="text-sm text-gray-600">Loading map...</p>
            </div>
        );
    }

    return (
        <div className={className}>
            <GoogleMap
                mapContainerStyle={style}
                center={center}
                zoom={zoom}
                options={options}
            >
                {marker && <Marker position={center} />}
            </GoogleMap>
        </div>
    );
}
