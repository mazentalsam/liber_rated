export async function api(path, body, { method = body ? 'POST' : 'GET', headers } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { ...(body && { 'content-type': 'application/json' }), ...headers },
    body: body && JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.')
  return data
}

// Great-circle distance in km.
export function distanceKm(a, b) {
  const rad = d => (d * Math.PI) / 180
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}
