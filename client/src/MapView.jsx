import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const OTTAWA = [45.4215, -75.6972]

// The numbered list is the accessible way to browse; the map is a visual companion with the same numbering.
// Pins are left out of the tab order (keyboard: false) so keyboard and screen reader users don't tab through duplicates.
// That list also satisfies WCAG 2.5.8's "equivalent control" exception when pins sit close together.
export default function MapView({ places, me, showMe }) {
  const el = useRef()
  const map = useRef()
  const pins = useRef()

  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView(OTTAWA, 14)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current)
    pins.current = L.layerGroup().addTo(map.current)
    return () => map.current.remove()
  }, [])

  useEffect(() => {
    pins.current.clearLayers()
    const points = []
    places.forEach((p, i) => {
      if (!p.location) return
      const at = [p.location.lat, p.location.lng]
      points.push(at)
      const link = document.createElement('a') // built as DOM, not HTML, so names can't inject markup
      link.href = `#/place/${p.id}`
      link.textContent = p.name
      L.marker(at, {
        title: `${i + 1}. ${p.name}`,
        keyboard: false,
        icon: L.divIcon({ className: 'pin', html: `<span>${i + 1}</span>`, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -16] }),
      }).bindPopup(link).addTo(pins.current)
    })
    if (me && showMe) {
      L.circleMarker([me.lat, me.lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#1d4ed8', fillOpacity: 1, interactive: false })
        .addTo(pins.current)
      points.push([me.lat, me.lng])
    }
    if (points.length) map.current.fitBounds(points, { padding: [40, 40], maxZoom: 15 })
  }, [places, me, showMe])

  return <div ref={el} className="map" role="region" aria-label="Map of results. The numbered list below shows the same places." />
}
