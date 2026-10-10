import { useState } from 'react'
import { api } from './api.js'
import { FEATURES } from '../../shared/features.js'
import { FeaturePicker } from './Features.jsx'

export default function ListBusiness() {
  const [form, setForm] = useState({ name: '', category: '', address: '' })
  const [features, setFeatures] = useState([])
  const [created, setCreated] = useState(null)
  const [error, setError] = useState('')

  const missing = FEATURES.filter(f => !features.includes(f.key))
  const percent = Math.round((features.length / FEATURES.length) * 100)
  const field = key => ({ id: key, value: form[key], required: true, maxLength: 200, onChange: e => setForm({ ...form, [key]: e.target.value }) })

  async function submit(e) {
    e.preventDefault()
    try {
      setCreated(await api('/places', { ...form, features }))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <h1>List your business</h1>
      <p className="lede">Tell customers what you already offer, and see the quick wins that would welcome more of them.</p>
      <p>Already listed? <a href="#/owner/6a0000000000000000000001/demo-owner">See a demo owner dashboard</a>.</p>
      <div className="search-layout two-col">
        <form onSubmit={submit} className="panel">
          <label htmlFor="name" className="field-label">Business name</label>
          <input {...field('name')} />
          <label htmlFor="category" className="field-label">Type of business</label>
          <input {...field('category')} placeholder="e.g. Café, Gym, Pharmacy" />
          <label htmlFor="address" className="field-label">Address</label>
          <input {...field('address')} autoComplete="street-address" />
          <FeaturePicker legend="What do you offer today?" selected={features} onChange={setFeatures} />
          <button>Publish listing</button>
          {error && <p role="alert" className="error">{error}</p>}
          {created && (
            <div role="status" className="success-box">
              <p><strong>Published!</strong> <a href={`#/place/${created.id}`}>View your public listing</a></p>
              <p>Save your private owner link. It's shown only once, and it's how you manage your listing:</p>
              <p><a className="owner-link" href={`#/owner/${created.id}/${created.ownerKey}`}>{`${location.origin}/#/owner/${created.id}/${created.ownerKey}`}</a></p>
            </div>
          )}
        </form>

        <section aria-labelledby="snapshot" className="panel snapshot">
          <h2 id="snapshot">Your accessibility snapshot</h2>
          <p className="score"><strong>{features.length}</strong> of {FEATURES.length} features ({percent}%)</p>
          <div className="bar" aria-hidden="true"><div style={{ width: `${percent}%` }} /></div>
          {missing.length ? (
            <>
              <h3>Quick wins</h3>
              <ul className="tips">
                {missing.slice(0, 4).map(f => <li key={f.key}><strong>{f.label}:</strong> {f.tip}</li>)}
              </ul>
              {missing.length > 4 && <p className="muted">+{missing.length - 4} more ideas once these are done.</p>}
            </>
          ) : <p>You offer everything on our list. Thank you for making your space welcoming!</p>}
        </section>
      </div>
    </>
  )
}
