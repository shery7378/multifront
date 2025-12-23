// src/controller/getLatLngFromPostcode.jsx
export async function getLatLngFromPostcode(postcode, country = null) {
  if (!postcode) return null;

  try {
    const encodedPostcode = encodeURIComponent(postcode.trim()); // trim bhi laga dein
    let url = `/api/geocode?postcode=${encodedPostcode}`;
    if (country) {
      url += `&country=${encodeURIComponent(country)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return await res.json(); // { lat, lng }
  } catch (err) {
    console.error("Error fetching geocode:", err);
    return null;
  }
}
