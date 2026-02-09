// app/api/reverse-geocode/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
        return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 });
    }

    try {
        const apiKey = process.env.GOOGLE_MAP_KEY; // server-only key

        // Try Google first if key present
        if (apiKey) {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === "OK" && data.results.length > 0) {
                const result = data.results[0];
                const components = result.address_components;
                
                // Extract postal code
                // For postal codes, prefer short_name (standardized format) over long_name
                const postalComponent = components.find((c) => 
                    c.types.includes("postal_code")
                );
                const postalCode = postalComponent ? (postalComponent.short_name || postalComponent.long_name) : "";
                
                // Extract formatted address
                const formattedAddress = result.formatted_address || "";
                
                // Extract city
                const city = components.find((c) => 
                    c.types.includes("locality")
                )?.long_name || 
                components.find((c) => 
                    c.types.includes("administrative_area_level_2")
                )?.long_name || "";
                
                return NextResponse.json({
                    postal_code: postalCode,
                    formatted_address: formattedAddress,
                    city: city,
                });
            }
            // fall through to OSM fallback
        }

        // Fallback: OpenStreetMap Nominatim reverse geocoding
        const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse');
        nominatimUrl.searchParams.set('lat', lat);
        nominatimUrl.searchParams.set('lon', lng);
        nominatimUrl.searchParams.set('format', 'json');
        nominatimUrl.searchParams.set('addressdetails', '1');

        const nomRes = await fetch(nominatimUrl.toString(), {
            headers: {
                'User-Agent': 'multikonnect-geocoder/1.0 (contact: support@multikonnect.local)'
            }
        });
        const nomData = await nomRes.json();
        
        if (nomData && nomData.address) {
            return NextResponse.json({
                postal_code: nomData.address.postcode || "",
                formatted_address: nomData.display_name || "",
                city: nomData.address.city || nomData.address.town || nomData.address.village || "",
            });
        }

        return NextResponse.json({ error: 'No results found for coordinates' }, { status: 404 });
    } catch (err) {
        return NextResponse.json(
            { error: "Server error", details: err.message },
            { status: 500 }
        );
    }
}

