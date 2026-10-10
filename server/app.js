import express from 'express'
import { ObjectId } from 'mongodb'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { FEATURES } from '../shared/features.js'

const KEYS = new Set(FEATURES.map(f => f.key))
const pickKeys = list => [...new Set(Array.isArray(list) ? list : [])].filter(k => KEYS.has(k))
const isText = (s, max) => typeof s === 'string' && s.trim().length > 0 && s.length <= max
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Owner keys are stored only as a hash, so a database leak doesn't leak edit access.
export const hashKey = key => createHash('sha256').update(String(key)).digest('hex')

export function summarize(place, needs = []) {
  const reviews = place.reviews ?? []
  const confirmations = {}
  for (const r of reviews) for (const k of r.confirmed) confirmations[k] = (confirmations[k] ?? 0) + 1
  return {
    id: place._id.toString(),
    name: place.name,
    category: place.category,
    address: place.address,
    location: place.location ?? null,
    features: place.features,
    rating: reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null,
    reviewCount: reviews.length,
    confirmations,
    requests: place.requests ?? {},
    matched: needs.filter(n => place.features.includes(n)).length,
  }
}

const withReviews = place => ({
  ...summarize(place),
  reviews: (place.reviews ?? []).toSorted((a, b) => b.createdAt - a.createdAt),
})

export function createApp(db, { insight = async () => null, geocode = async () => null } = {}) {
  const places = db.collection('places')
  const app = express()
  app.use(express.json({ limit: '10kb' }))

  // No accounts: whoever holds the owner key (from the private owner link) can manage the listing.
  async function ownedPlace(req) {
    const key = req.get('x-owner-key')
    if (!key || !ObjectId.isValid(req.params.id)) return null
    const place = await places.findOne({ _id: new ObjectId(req.params.id) })
    if (!place?.ownerKeyHash) return null
    return timingSafeEqual(Buffer.from(place.ownerKeyHash, 'hex'), Buffer.from(hashKey(key), 'hex')) ? place : null
  }

  app.get('/api/owner/:id', async (req, res) => {
    const place = await ownedPlace(req)
    if (!place) return res.status(403).json({ error: 'This owner link is not valid.' })
    res.json(withReviews(place))
  })

  app.put('/api/owner/:id/features', async (req, res) => {
    const place = await ownedPlace(req)
    if (!place) return res.status(403).json({ error: 'This owner link is not valid.' })
    const features = pickKeys(req.body?.features)
    // Requests for features the owner now offers are fulfilled, so they're cleared.
    const fulfilled = Object.fromEntries(features.map(k => [`requests.${k}`, '']))
    const updated = await places.findOneAndUpdate(
      { _id: place._id },
      { $set: { features }, ...(features.length && { $unset: fulfilled }) },
      { returnDocument: 'after' },
    )
    res.json(withReviews(updated))
  })

  app.get('/api/places', async (req, res) => {
    const q = String(req.query.q ?? '').trim().slice(0, 100)
    const needs = pickKeys(String(req.query.needs ?? '').split(','))
    const re = { $regex: escapeRegex(q), $options: 'i' }
    const filter = q ? { $or: [{ name: re }, { category: re }, { address: re }] } : {}
    // shortcut: ranks in memory, fine for a few thousand places; move to an aggregation pipeline past that.
    const list = (await places.find(filter).toArray()).map(p => summarize(p, needs))
    list.sort((a, b) => b.matched - a.matched || (b.rating ?? 0) - (a.rating ?? 0))
    res.json(list)
  })

  app.get('/api/places/:id', async (req, res) => {
    const place = ObjectId.isValid(req.params.id) && await places.findOne({ _id: new ObjectId(req.params.id) })
    if (!place) return res.status(404).json({ error: 'Place not found' })
    res.json(withReviews(place))
  })

  app.get('/api/places/:id/insight', async (req, res) => {
    const place = ObjectId.isValid(req.params.id) && await places.findOne({ _id: new ObjectId(req.params.id) })
    if (!place) return res.status(404).json({ error: 'Place not found' })
    const needs = pickKeys(String(req.query.needs ?? '').split(','))
    res.json({ summary: needs.length ? await insight(place, needs) : null })
  })

  app.post('/api/places/:id/requests', async (req, res) => {
    const feature = req.body?.feature
    if (!KEYS.has(feature)) return res.status(400).json({ error: 'Unknown feature.' })
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Place not found' })
    // shortcut: no accounts, so one person can request repeatedly; the client only dedupes per device.
    const place = await places.findOneAndUpdate(
      { _id: new ObjectId(req.params.id), features: { $ne: feature } },
      { $inc: { [`requests.${feature}`]: 1 } },
      { returnDocument: 'after' },
    )
    if (!place) return res.status(409).json({ error: 'This place already offers that, or it does not exist.' })
    res.status(201).json(withReviews(place))
  })

  app.post('/api/places', async (req, res) => {
    const { name, category, address, features } = req.body ?? {}
    if (![name, category, address].every(s => isText(s, 200))) {
      return res.status(400).json({ error: 'Name, category and address are required (max 200 characters).' })
    }
    const ownerKey = randomBytes(24).toString('base64url')
    const place = {
      name: name.trim(), category: category.trim(), address: address.trim(), features: pickKeys(features),
      location: await geocode(address.trim()), reviews: [], requests: {}, ownerKeyHash: hashKey(ownerKey),
    }
    const { insertedId } = await places.insertOne(place)
    // The key is shown once, here; only its hash is stored.
    res.status(201).json({ ...summarize({ ...place, _id: insertedId }), ownerKey })
  })

  app.post('/api/places/:id/reviews', async (req, res) => {
    const { rating, confirmed, comment = '' } = req.body ?? {}
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' })
    if (typeof comment !== 'string' || comment.length > 1000) return res.status(400).json({ error: 'Comment must be under 1000 characters.' })
    if (!ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Place not found' })
    const review = { rating, confirmed: pickKeys(confirmed), comment: comment.trim(), createdAt: new Date() }
    const place = await places.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $push: { reviews: review } },
      { returnDocument: 'after' },
    )
    if (!place) return res.status(404).json({ error: 'Place not found' })
    res.status(201).json(withReviews(place))
  })

  return app
}
