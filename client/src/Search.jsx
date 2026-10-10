import { useEffect, useState } from 'react'
import { api, distanceKm } from './api.js'
import MapView from './MapView.jsx'
import { FeaturePicker, FeatureTags, Rating } from './Features.jsx'
import { loadNeeds, saveNeeds } from './store.js'

export default function Search() {
  const [needs, setNeeds] = useState(loadNeeds)
  const [q, setQ] = useState('')
  const [places, setPlaces] = useState(null)
  const [error, setError] = useState('')

  const [me, setMe] = useState(null) // never stored or sent to the server
  const [locating, setLocating] = useState('')

  useEffect(() => saveNeeds(needs), [needs])

  function findMe() {
    if (!navigator.geolocation) return setLocating("This browser can't share your location.")
    setLocating('Finding your location…')
    navigator.geolocation.getCurrentPosition(
      pos => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating('') },
      () => setLocating("We couldn't get your location. Check your browser's location permission."),
      { timeout: 10000 },
    )
  }

  useEffect(() => {
    let stale = false
    const timer = setTimeout(() => {
      api(`/places?q=${encodeURIComponent(q)}&needs=${needs.join(',')}`).then(
        data => { if (!stale) { setPlaces(data); setError('') } },
        err => { if (!stale) setError(err.message) },
      )
    }, 250)
    return () => { stale = true; clearTimeout(timer) }
  }, [q, needs])

  // Needs come first; distance breaks ties once we know where you are.
  const shown = places && me
    ? places.map(p => ({ ...p, km: p.location && distanceKm(me, p.location) }))
      .toSorted((a, b) => b.matched - a.matched || (a.km ?? Infinity) - (b.km ?? Infinity))
    : places
  const nearest = shown && me ? Math.min(...shown.map(p => p.km ?? Infinity)) : Infinity
  const farAway = me && nearest > 50

  return (
    <>
      <h1>Find places that work for you</h1>
      <p className="lede">
        Tell us what you need once. Every place is ranked by how well it fits you, and the features are confirmed by people who've been there.
      </p>
      <div className="search-layout">
        <aside>
          <FeaturePicker legend="Your needs" selected={needs} onChange={setNeeds} />
          <p className="hint">Saved on this device only.</p>
        </aside>
        <section aria-label="Results">
          <label htmlFor="q" className="field-label">Search by name, type or address</label>
          <input id="q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. café, Bank St" />
          <div className="results-bar">
            <p role="status" className="muted">
              {places ? `${places.length} place${places.length === 1 ? '' : 's'} found${me && !farAway ? ', closest first among equal matches' : ''}` : 'Loading places…'}
            </p>
            <button type="button" className="ghost" onClick={findMe}>{me ? 'Update my location' : 'Near me'}</button>
          </div>
          {(locating || farAway) && (
            <p role="status" className="hint">
              {locating || `You're about ${Math.round(nearest)} km from the nearest listed place. This demo only has places in Ottawa.`}
            </p>
          )}
          {shown?.length > 0 && <MapView places={shown} me={me} showMe={!farAway} />}
          {error && <p role="alert" className="error">{error}</p>}
          {places?.length === 0 && (
            <div className="empty">
              <p><strong>No places match “{q}”.</strong></p>
              <p>Try another name or street. Know a place that belongs here? <a href="#/business">Add it</a>.</p>
            </div>
          )}
          <ul className="cards">
            {shown?.map((p, i) => (
              <li key={p.id}>
                <article className="card">
                  <h2><span className="rank" aria-hidden="true">{i + 1}</span><a href={`#/place/${p.id}`}>{p.name}</a></h2>
                  <p className="muted">
                    {p.category} · {p.address}
                    {p.km != null && !farAway && <> · <strong>{p.km < 1 ? `${Math.round(p.km * 1000)} m` : `${p.km.toFixed(1)} km`} away</strong></>}
                  </p>
                  <Rating {...p} />
                  {needs.length > 0 && (
                    <p className={p.matched === needs.length ? 'match full' : 'match'}>
                      Meets {p.matched} of your {needs.length} need{needs.length > 1 ? 's' : ''}
                    </p>
                  )}
                  <FeatureTags keys={p.features} highlight={needs} />
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
