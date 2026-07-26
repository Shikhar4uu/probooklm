// server/src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { prisma } from './infra/db.js'
import { notebooksRouter } from './modules/notebooks/notebooks.routes.js'
import { sourcesRouter } from './modules/sources/sources.routes.js'
import { chatRouter } from './modules/chat/chat.routes.js'  // NEW


const app = express()

// --- Global middleware ---
app.use(cors({ origin: process.env.CLIENT_URL })) // allow the frontend origin
app.use(express.json())                            // parse JSON request bodies

// --- Routes ---
app.use('/api/notebooks', notebooksRouter) // /api/notebooks ...
app.use('/api', sourcesRouter)             // /api/notebooks/:id/sources, /api/sources/:id ...
app.use('/api', chatRouter)   
// --- Health check ---
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'up', db: true })
  } catch (err) {
    res.status(500).json({ status: 'up', db: false, error: String(err) })
  }
})

// --- Start server ---
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`API running on http://localhost:${port}`))