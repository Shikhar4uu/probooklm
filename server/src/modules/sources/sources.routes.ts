// server/src/modules/sources/sources.routes.ts
import { Router } from 'express'
import multer from 'multer'
import {
  listSources,
  createSourceRow,
  deleteSource,
  getSource,
} from './sources.service.js'
import { ingestSource } from '../../ingestion/pipeline.js'

export const sourcesRouter = Router()

// Store uploaded files in memory so we can pass the buffer straight to the extractor
const upload = multer({ storage: multer.memoryStorage() })

// GET /api/notebooks/:notebookId/sources → list a notebook's sources (frontend polls this)
sourcesRouter.get('/notebooks/:notebookId/sources', async (req, res) => {
  const notebookId = String(req.params.notebookId ?? '')
  const sources = await listSources(notebookId)
  res.json(sources)
})

// POST /api/notebooks/:notebookId/sources → add a source (text in body, PDF as multipart 'file')
sourcesRouter.post(
  '/notebooks/:notebookId/sources',
  upload.single('file'),
  async (req, res) => {
    // Coerce every incoming value to a plain string (params/body can be string | string[])
    const notebookId = String(req.params.notebookId ?? '')
    const type = String(req.body.type ?? '')
    const title = String(req.body.title ?? '')
    const text = req.body.text != null ? String(req.body.text) : undefined

    if (!type || !title) {
      return res.status(400).json({ error: 'type and title required' })
    }

    const source = await createSourceRow({ notebookId, type, title })

    // fire-and-forget: run ingestion in the background, return immediately
    ingestSource(source.id, { text, buffer: req.file?.buffer }).catch(console.error)

    res.status(201).json(source)
  },
)

// DELETE /api/sources/:id → remove a source (its chunks cascade-delete)
sourcesRouter.delete('/sources/:id', async (req, res) => {
  const id = String(req.params.id ?? '')
  await deleteSource(id)
  res.status(204).end()
})

// POST /api/sources/:id/reindex → re-run ingestion for a source
sourcesRouter.post('/sources/:id/reindex', async (req, res) => {
  const id = String(req.params.id ?? '')
  const source = await getSource(id)
  if (!source) return res.status(404).json({ error: 'not found' })

  // Note: reindex works for text/web/youtube/vtt; PDFs need re-upload (buffer isn't stored)
  ingestSource(source.id, {}).catch(console.error)

  res.json(source)
})