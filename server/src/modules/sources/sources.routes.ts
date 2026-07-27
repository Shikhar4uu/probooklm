import { Router } from 'express'
import multer from 'multer'
import { createSourceRow, listSources, deleteSource } from './sources.service.js'
import { ingestSource } from '../../ingestion/pipeline.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
})

const router = Router()

/* List sources in a notebook */
router.get('/notebooks/:notebookId/sources', async (req, res, next) => {
  try {
    const notebookId = String(req.params.notebookId ?? '')
    res.json(await listSources(notebookId))
  } catch (err) {
    next(err)
  }
})

/* Add a source: text | pdf | website | youtube | vtt */
router.post(
  '/notebooks/:notebookId/sources',
  upload.single('file'),
  async (req, res, next) => {
    try {
      const notebookId = String(req.params.notebookId ?? '')
      const type = String(req.body.type ?? '')
      const url = String(req.body.url ?? '')
      const text = String(req.body.text ?? '')

      if (!notebookId) return res.status(400).json({ error: 'Missing notebookId' })
      if (!type) return res.status(400).json({ error: 'Missing source type' })

      /* Derive a sensible title */
      let title = String(req.body.title ?? '')
      if (!title) {
        if (req.file) title = req.file.originalname
        else if (url) title = url.replace(/^https?:\/\//, '').slice(0, 80)
        else title = text.slice(0, 60) || 'Untitled source'
      }

      /* Validate required input per type */
      if ((type === 'website' || type === 'youtube') && !url) {
        return res.status(400).json({ error: `A URL is required for ${type} sources` })
      }
      if (type === 'pdf' && !req.file) {
        return res.status(400).json({ error: 'A PDF file is required' })
      }
      if (type === 'text' && !text) {
        return res.status(400).json({ error: 'Text content is required' })
      }
      if (type === 'vtt' && !req.file && !text) {
        return res.status(400).json({ error: 'A .vtt file is required' })
      }

      const source = await createSourceRow({ notebookId, type, title })

      /* Fire and forget — the client polls for status */
      void ingestSource(source.id, {
        text: text || undefined,
        url: url || undefined,
        buffer: req.file?.buffer,
      })

      res.status(201).json(source)
    } catch (err) {
      next(err)
    }
  }
)

/* Delete a source (chunks cascade) */
router.delete('/sources/:id', async (req, res, next) => {
  try {
    await deleteSource(String(req.params.id ?? ''))
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export const sourcesRouter = router
export default router