// Address -> { lat, lng } via OpenStreetMap Nominatim, or null if it can't be found.
// shortcut: Nominatim's free tier allows ~1 request/second; switch to a paid geocoder before real traffic.
export async function geocode(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=${encodeURIComponent(address)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'LiberRated-demo/0.1' }, signal: AbortSignal.timeout(5000) })
    const [hit] = await res.json()
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null
  } catch {
    return null
  }
}
