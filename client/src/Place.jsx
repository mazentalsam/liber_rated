import { useEffect, useState } from 'react'
import { api } from './api.js'
import { FEATURES } from '../../shared/features.js'
import { FeaturePicker, FeatureTags, LABEL, Rating } from './Features.jsx'
import { loadNeeds, loadRequested, saveRequested } from './store.js'

const TIP = Object.fromEntries(FEATURES.map(f => [f.key, f.tip]))
const visitors = n => `${n} visitor${n === 1 ? '' : 's'}`

export default function Place({ id }) {
  const [needs] = useState(loadNeeds)
  const [place, setPlace] = useState(null)
  const [error, setError] = useState('')
  const [insight, setInsight] = useState({ loading: needs.length > 0 })
  const [requested, setRequested] = useState(loadRequested)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let stale = false
    setPlace(null)
    setInsight({ loading: needs.length > 0 })
    api(`/places/${id}`).then(p => !stale && setPlace(p), err => !stale && setError(err.message))
    if (needs.length) {
      api(`/places/${id}/insight?needs=${needs.join(',')}`).then(
        d => !stale && setInsight({ text: d.summary }),
        () => !stale && setInsight({}),
      )
    }
    return () => { stale = true }
  }, [id, needs])

  if (error) return (
    <>
      <h1>Place not found</h1>
      <p role="alert" className="error">{error} <a href="#/">Back to search</a></p>
    </>
  )
  if (!place) return <p>Loading…</p>

  const isRequested = key => requested.includes(`${id}:${key}`)
  async function request(key) {
    try {
      setPlace(await api(`/places/${id}/requests`, { feature: key }))
      const next = [...requested, `${id}:${key}`]
      setRequested(next)
      saveRequested(next)
      setNotice(`Request sent. ${place.name} can now see that visitors want: ${LABEL[key]}.`)
    } catch (err) {
      setNotice(err.message)
    }
  }

  const offered = FEATURES.filter(f => place.features.includes(f.key))
  const asks = Object.entries(place.requests).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])

  return (
    <>
      <p><a href="#/">← Back to search</a></p>
      <h1>{place.name}</h1>
      <p className="muted">{place.category} · {place.address}</p>
      <Rating {...place} />
      <p role="status" className="notice">{notice}</p>

      <FitPanel place={place} needs={needs} insight={insight} isRequested={isRequested} onRequest={request} />

      <h2>What they offer</h2>
      {offered.length ? (
        <ul className="features">
          {offered.map(f => {
            const n = place.confirmations[f.key] ?? 0
            return (
              <li key={f.key}>
                <span>{f.label}</span>
                <span className={n ? 'badge verified' : 'badge'}>
                  {n ? `Confirmed by ${visitors(n)}` : 'Listed by business, not yet confirmed'}
                </span>
              </li>
            )
          })}
        </ul>
      ) : <p>This place hasn't listed any accessibility or allergen features yet.</p>}

      <section className="panel" aria-labelledby="asks">
        <h2 id="asks">Upgrades visitors are asking for</h2>
        {asks.length ? (
          <ul className="asks">
            {asks.map(([key, n]) => (
              <li key={key}>
                <p className="ask-head"><strong>{LABEL[key]}</strong><span className="count">{visitors(n)}</span></p>
                <p className="muted"><span className="owner">For the owner:</span> {TIP[key]}</p>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No requests yet.</p>}
        <RequestForm place={place} isRequested={isRequested} onRequest={request} />
      </section>

      <h2>Reviews</h2>
      {place.reviews.length ? (
        <ul className="reviews">
          {place.reviews.map((r, i) => (
            <li key={i} className="card">
              <p className="rating"><span aria-hidden="true">★ </span>{r.rating} out of 5 · <time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleDateString()}</time></p>
              {r.comment && <p>{r.comment}</p>}
              {r.confirmed.length > 0 && <FeatureTags keys={r.confirmed} highlight={r.confirmed} />}
            </li>
          ))}
        </ul>
      ) : <p>No reviews yet. Be the first.</p>}

      <ReviewForm place={place} onSaved={setPlace} />
    </>
  )
}

function FitPanel({ place, needs, insight, isRequested, onRequest }) {
  if (!needs.length) {
    return (
      <section className="panel fit" aria-label="How it fits you">
        <p><strong>See how this place fits you.</strong> <a href="#/">Choose your needs</a> and we'll check each one against what visitors have confirmed.</p>
      </section>
    )
  }
  const met = needs.filter(k => place.features.includes(k)).length
  return (
    <section className="panel fit" aria-labelledby="fit">
      <h2 id="fit">How it fits you</h2>
      <p className={met === needs.length ? 'match full' : 'match'}>Meets {met} of your {needs.length} need{needs.length > 1 ? 's' : ''}</p>
      {insight.loading && <p className="insight muted">Reading reviews for your needs…</p>}
      {insight.text && (
        <div className="insight">
          <p className="insight-label">AI summary of {place.reviewCount} review{place.reviewCount === 1 ? '' : 's'}</p>
          <p>{insight.text}</p>
        </div>
      )}
      <ul className="fit-list">
        {needs.map(k => {
          const n = place.confirmations[k] ?? 0
          const has = place.features.includes(k)
          return (
            <li key={k} className={has ? (n ? 'yes' : 'maybe') : 'no'}>
              <span className="mark" aria-hidden="true">{has ? (n ? '✓' : '?') : '✕'}</span>
              <span className="fit-label">{LABEL[k]}</span>
              <span className="fit-status">
                {has ? (n ? `Confirmed by ${visitors(n)}` : 'Listed, not yet confirmed') : 'Not offered'}
              </span>
              {!has && (
                <button className="small" disabled={isRequested(k)} onClick={() => onRequest(k)}>
                  {isRequested(k) ? 'Requested' : 'Ask them to add it'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function RequestForm({ place, isRequested, onRequest }) {
  const [pick, setPick] = useState('')
  const missing = FEATURES.filter(f => !place.features.includes(f.key))
  if (!missing.length) return null
  const submit = e => { e.preventDefault(); if (pick) onRequest(pick).then(() => setPick('')) }
  return (
    <form onSubmit={submit} className="request-form">
      <label htmlFor="request" className="field-label">Missing something? Ask {place.name} for it</label>
      <div className="row">
        <select id="request" value={pick} onChange={e => setPick(e.target.value)}>
          <option value="">Choose a feature…</option>
          {missing.map(f => (
            <option key={f.key} value={f.key} disabled={isRequested(f.key)}>
              {f.label}{isRequested(f.key) ? ' (requested)' : ''}
            </option>
          ))}
        </select>
        <button disabled={!pick}>Send request</button>
      </div>
    </form>
  )
}

function ReviewForm({ place, onSaved }) {
  const [rating, setRating] = useState(0)
  const [confirmed, setConfirmed] = useState([])
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!rating) return setStatus('Please choose a rating from 1 to 5.')
    setSaving(true)
    try {
      onSaved(await api(`/places/${place.id}/reviews`, { rating, confirmed, comment }))
      setRating(0); setConfirmed([]); setComment('')
      setStatus('Thanks! Your review was added.')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="panel">
      <h2>Share your visit</h2>
      <fieldset className="picker">
        <legend>Overall accessibility rating</legend>
        <div className="rating-input">
          {[1, 2, 3, 4, 5].map(n => (
            <label key={n}>
              <input type="radio" name="rating" checked={rating === n} onChange={() => setRating(n)} />
              {n}
            </label>
          ))}
        </div>
      </fieldset>
      <FeaturePicker
        legend="Which features did you confirm in person?"
        options={place.features.length ? place.features : undefined}
        selected={confirmed}
        onChange={setConfirmed}
      />
      <label htmlFor="comment" className="field-label">Comment (optional)</label>
      <textarea id="comment" rows={3} maxLength={1000} value={comment} onChange={e => setComment(e.target.value)} />
      <button disabled={saving}>{saving ? 'Posting…' : 'Post review'}</button>
      <p role="status">{status}</p>
    </form>
  )
}
