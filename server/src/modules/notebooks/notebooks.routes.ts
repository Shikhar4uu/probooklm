// server/src/modules/notebooks/notebooks.routes.ts
import { Router } from 'express'
import {
  listNotebooks,
  createNotebook,
  updateNotebook,
  deleteNotebook,
} from './notebooks.service'

export const notebooksRouter = Router()

// GET /api/notebooks  → list all
notebooksRouter.get('/', async (_req, res) => {
  const notebooks = await listNotebooks()
  res.json(notebooks)
})

// POST /api/notebooks  → create
notebooksRouter.post('/', async (req, res) => {
  const { title, icon } = req.body
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' })
  }
  const notebook = await createNotebook(title.trim(), icon)
  res.status(201).json(notebook)
})

// PATCH /api/notebooks/:id  → rename
notebooksRouter.patch('/:id', async (req, res) => {
  const { title, icon } = req.body
  const notebook = await updateNotebook(req.params.id, title, icon)
  res.json(notebook)
})

// DELETE /api/notebooks/:id  → delete
notebooksRouter.delete('/:id', async (req, res) => {
  await deleteNotebook(req.params.id)
  res.status(204).end()
})