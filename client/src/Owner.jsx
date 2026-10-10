import { useEffect, useState } from 'react'
import { api } from './api.js'
import { FEATURES } from '../../shared/features.js'
import { FeaturePicker, LABEL } from './Features.jsx'

const TIP = Object.fromEntries(FEATURES.map(f => [f.key, f.tip]))

export default function Owner({ id, ownerKey }) {
  const [place, setPlace] = useState(null)
  const [features, setFeatures] = useState([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const headers = { 'x-owner-key': ownerKey ?? '' }

  useEffect(() => {
    api(`/owner/${id}`, undefined, { headers }).then(p => { setPlace(p); setFeatures(p.features) }, err => setError(err.message))
  }, [id, ownerKey])

  async function save(next, message) {
    try {
      const updated = await api(`/owner/${id}/features`, { features: next }, { method: 'PUT', headers })
      setPlace(updated)
      setFeatures(updated.features)
      setStatus(message)
    } catch (err) {
      setStatus(err.message)
    }
  }

  if (error) return (
    <>
      <h1>Owner dashboard</h1>
      <p role="alert" className="error">{error} Check that you copied the whole owner link.</p>
    </>
  )
  if (!place) return <p>Loading…</p>

  const asks = Object.entries(place.requests).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  const openRequests = asks.reduce((sum, [, n]) => sum + n, 0)
  const unsaved = features.length !== place.features.length || features.some(k => !place.features.includes(k))

  return (
    <>
      <p className="eyebrow">Owner dashboard</p>
      <h1>{place.name}</h1>
      <p className="muted">{place.category} · {place.address} · <a href={`#/place/${place.id}`}>View public listing</a></p>
      <p className="private-note">
        This is your private owner link. Bookmark it and don't share it: anyone with the link can edit this listing.
      </p>
      <p role="status" className="notice">{status}</p>

      <dl className="stats">
        <div><dt>Rating</dt><dd>{place.rating ? place.rating.toFixed(1) : '–'}<small>/ 5</small></dd></div>
        <div><dt>Reviews</dt><dd>{place.reviewCount}</dd></div>
        <div><dt>Features offered</dt><dd>{place.features.length}<small>/ {FEATURES.length}</small></dd></div>
        <div><dt>Open requests</dt><dd>{openRequests}</dd></div>
      </dl>

      <section className="panel" aria-labelledby="asks">
        <h2 id="asks">What customers are asking for</h2>
        {asks.length ? (
          <ul className="asks">
            {asks.map(([key, n]) => (
              <li key={key} className="owner-ask">
                <div>
                  <p className="ask-head"><strong>{LABEL[key]}</strong><span className="count">{n} request{n === 1 ? '' : 's'}</span></p>
                  <p className="muted">{TIP[key]}</p>
                </div>
                <button className="small" onClick={() => save([...place.features, key], `Marked as added: ${LABEL[key]}. Your public listing is updated.`)}>
                  We've added this
                </button>
              </li>
            ))}
          </ul>
        ) : <p>No open requests. Customers can ask for upgrades from your public listing.</p>}
      </section>

      <section className="panel" aria-labelledby="listing">
        <h2 id="listing">Your listing</h2>
        <FeaturePicker legend="What do you offer today?" selected={features} onChange={setFeatures} />
        <button disabled={!unsaved} onClick={() => save(features, 'Saved. Your public listing is updated.')}>Save changes</button>
      </section>
    </>
  )
}
