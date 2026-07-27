/* ------------------------------------------------------------------
   Polyfill for pdf.js (inside unpdf) on Node 24.
   MUST run before any other import that touches PDF parsing.
------------------------------------------------------------------ */
// @ts-expect-error - Math.sumPrecise is a newer proposal not yet in Node
if (typeof Math.sumPrecise !== 'function') {
  // @ts-expect-error - assigning the polyfill
  Math.sumPrecise = (nums: Iterable<number>) => {
    let sum = 0
    for (const n of nums) sum += n
    return sum
  }
}

import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { env } from './config/env.js'
import { prisma } from './infra/db.js'

import {notebooksRouter} from './modules/notebooks/notebooks.routes.js'
import {sourcesRouter} from './modules/sources/sources.routes.js'
import {chatRouter} from './modules/chat/chat.routes.js'

const app = express()

/* ------------------------------------------------------------------
   Middleware
------------------------------------------------------------------ */
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173'],
    credentials: true,
  })
)

// PDFs and long text need a generous body limit
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

/* ------------------------------------------------------------------
   Health check
------------------------------------------------------------------ */
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, db: 'connected', time: new Date().toISOString() })
  } catch (err) {
    console.error('HEALTH CHECK FAILED:', err)
    res.status(500).json({ ok: false, db: 'error', error: String(err) })
  }
})

/* ------------------------------------------------------------------
   Routes
------------------------------------------------------------------ */
app.use('/api/notebooks', notebooksRouter)
app.use('/api', sourcesRouter)
app.use('/api', chatRouter)

/* ------------------------------------------------------------------
   404 handler
------------------------------------------------------------------ */
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` })
})

/* ------------------------------------------------------------------
   Global error handler — always returns JSON so the client can show it
------------------------------------------------------------------ */
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('UNHANDLED ERROR:', err)
    res.status(err?.status ?? 500).json({
      error: err?.message ?? 'Internal server error',
    })
  }
)

/* ------------------------------------------------------------------
   Start
------------------------------------------------------------------ */
const port = Number(env.PORT) || 3000

app.listen(port, () => {
  console.log(`✅ ProbookLM server running on http://localhost:${port}`)
  console.log(`   Health:  http://localhost:${port}/api/health`)
  console.log(`   Client:  ${env.CLIENT_URL}`)
})

/* Clean shutdown so Prisma releases its connections */
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})