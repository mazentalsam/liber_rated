import express from 'express'
import { mkdirSync } from 'node:fs'
import { MongoClient } from 'mongodb'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { seed } from './seed.js'
import { insight } from './insight.js'
import { geocode } from './geocode.js'

let uri = process.env.MONGODB_URI
if (!uri) {
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  // Saved to server/.data so listings, reviews and requests survive restarts. Delete the folder to reset the demo.
  const dbPath = fileURLToPath(new URL('.data', import.meta.url))
  mkdirSync(dbPath, { recursive: true })
  uri = (await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } })).getUri()
  console.log('No MONGODB_URI set: using a local MongoDB saved in server/.data.')
}
if (!process.env.ANTHROPIC_API_KEY) console.log('No ANTHROPIC_API_KEY set: AI insights are off, rule-based fit still works.')
const db = (await MongoClient.connect(uri)).db('liberrated')
const places = db.collection('places')
if (!(await places.countDocuments())) await places.insertMany(seed())

const app = createApp(db, { insight, geocode })
app.use(express.static(fileURLToPath(new URL('../client/dist', import.meta.url))))
const port = process.env.PORT ?? 3001
app.listen(port, () => console.log(`LiberRated running on http://localhost:${port}`))
