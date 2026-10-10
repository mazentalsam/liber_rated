import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from './app.js'
import { seed, DEMO_OWNER } from './seed.js'

let mongo, client, server, base
before(async () => {
  mongo = await MongoMemoryServer.create()
  client = await MongoClient.connect(mongo.getUri())
  const db = client.db('test')
  await db.collection('places').insertMany(seed())
  server = createApp(db, { insight: async (place, needs) => `fits ${needs.length}` }).listen(0)
  base = `http://localhost:${server.address().port}/api`
})
after(async () => { server.close(); await client.close(); await mongo.stop() })

const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

test('ranks places by how many needs they meet, ignoring unknown needs', async () => {
  const list = await (await fetch(`${base}/places?needs=nut_free,gluten_free,bogus`)).json()
  assert.equal(list[0].matched, 2)
  assert.ok(list.every((p, i) => i === 0 || list[i - 1].matched >= p.matched))
})

test('search treats regex characters literally', async () => {
  const res = await fetch(`${base}/places?q=${encodeURIComponent('.*(')}`)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), [])
})

test('review validates input and updates confirmations and rating', async () => {
  const [place] = await (await fetch(`${base}/places?q=Corner`)).json()
  assert.equal((await post(`/places/${place.id}/reviews`, { rating: 7 })).status, 400)
  const res = await post(`/places/${place.id}/reviews`, { rating: 4, confirmed: ['step_free', 'step_free', 'nope'], comment: 'Good' })
  const updated = await res.json()
  assert.equal(res.status, 201)
  assert.equal(updated.rating, 4)
  assert.deepEqual(updated.confirmations, { step_free: 1 })
  assert.equal((await post('/places/notanid/reviews', { rating: 3 })).status, 404)
})

test('business listing requires name, category and address', async () => {
  assert.equal((await post('/places', { name: 'X' })).status, 400)
  const res = await post('/places', { name: 'New Spot', category: 'Café', address: '1 Test St', features: ['step_free'] })
  assert.equal(res.status, 201)
  assert.deepEqual((await res.json()).features, ['step_free'])
})

test('upgrade requests count up, reject unknown or already-offered features', async () => {
  const [place] = await (await fetch(`${base}/places?q=Dumpling`)).json()
  assert.equal((await post(`/places/${place.id}/requests`, { feature: 'nope' })).status, 400)
  assert.equal((await post(`/places/${place.id}/requests`, { feature: 'dairy_free' })).status, 409)
  const before = place.requests.step_free ?? 0
  const res = await post(`/places/${place.id}/requests`, { feature: 'step_free' })
  assert.equal(res.status, 201)
  assert.equal((await res.json()).requests.step_free, before + 1)
})

test('insight passes only valid needs, and is skipped with no needs', async () => {
  const [place] = await (await fetch(`${base}/places?q=Maple`)).json()
  assert.deepEqual(await (await fetch(`${base}/places/${place.id}/insight?needs=step_free,bogus`)).json(), { summary: 'fits 1' })
  assert.deepEqual(await (await fetch(`${base}/places/${place.id}/insight`)).json(), { summary: null })
})

test('owner dashboard requires the right key, and adding a feature clears its requests', async () => {
  const url = `${base}/owner/${DEMO_OWNER.id}`
  assert.equal((await fetch(url)).status, 403)
  assert.equal((await fetch(url, { headers: { 'x-owner-key': 'wrong' } })).status, 403)
  const headers = { 'x-owner-key': DEMO_OWNER.key, 'content-type': 'application/json' }
  const place = await (await fetch(url, { headers })).json()
  assert.ok(place.requests.ingredient_list > 0)
  const res = await fetch(`${url}/features`, { method: 'PUT', headers, body: JSON.stringify({ features: [...place.features, 'ingredient_list', 'bogus'] }) })
  const updated = await res.json()
  assert.ok(updated.features.includes('ingredient_list') && !updated.features.includes('bogus'))
  assert.equal(updated.requests.ingredient_list, undefined)
})

test('a new listing returns its owner key once and never exposes the hash', async () => {
  const created = await (await post('/places', { name: 'Key Spot', category: 'Café', address: '2 Test St' })).json()
  assert.ok(created.ownerKey.length > 20)
  const owner = await fetch(`${base}/owner/${created.id}`, { headers: { 'x-owner-key': created.ownerKey } })
  assert.equal(owner.status, 200)
  const pub = JSON.stringify(await (await fetch(`${base}/places/${created.id}`)).json())
  assert.ok(!pub.includes('ownerKey'))
})
