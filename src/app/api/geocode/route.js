// app/api/geocode/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get("postcode");
    const country = searchParams.get("country"); // optional

    if (!postcode) {
        return NextResponse.json({ error: "Postcode is required" }, { status: 400 });
    }

    try {
        const apiKey = process.env.GOOGLE_MAP_KEY; // server-only key
        const encodedPostcode = postcode.trim().replace(/\s+/g, "+");

        // Try Google first if key present
        if (apiKey) {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedPostcode}${country ? "," + encodeURIComponent(country) : ""}&key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === "OK" && data.results.length > 0) {
                const result = data.results[0];
                const location = result.geometry.location;
                const components = result.address_components || [];
                
                // Extract city name - try multiple address component types
                const city = components.find((c) => 
                    c.types.includes("locality")
                )?.long_name || 
                components.find((c) => 
                    c.types.includes("administrative_area_level_2")
                )?.long_name ||
                components.find((c) => 
                    c.types.includes("administrative_area_level_1")
                )?.long_name || "";
                
                return NextResponse.json({
                    lat: location.lat,
                    lng: location.lng,
                    city: city
                });
            }
            // fall through to OSM fallback
        }

        // Fallback: OpenStreetMap Nominatim
        const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
        nominatimUrl.searchParams.set('q', country ? `${postcode} ${country}` : postcode);
        nominatimUrl.searchParams.set('format', 'json');
        nominatimUrl.searchParams.set('limit', '1');

        const nomRes = await fetch(nominatimUrl.toString(), {
            headers: {
                'User-Agent': 'multikonnect-geocoder/1.0 (contact: support@multikonnect.local)'
            }
        });
        const nomData = await nomRes.json();
        if (Array.isArray(nomData) && nomData.length > 0) {
            const first = nomData[0];
            // Extract city from OSM result
            const city = first.address?.city || 
                        first.address?.town || 
                        first.address?.village || 
                        first.address?.county || 
                        "";
            
            return NextResponse.json({ 
                lat: parseFloat(first.lat), 
                lng: parseFloat(first.lon),
                city: city
            });
        }

        return NextResponse.json({ error: 'No results found for postcode' }, { status: 404 });
    } catch (err) {
        return NextResponse.json(
            { error: "Server error", details: err.message },
            { status: 500 }
        );
    }
}
