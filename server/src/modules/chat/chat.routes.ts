// server/src/modules/chat/chat.routes.ts
import { Router } from 'express'
import { answerQuestion } from '../../rag/chat.js'
import { listMessages, saveMessage } from '../messages/messages.service.js'

export const chatRouter = Router()

// GET /api/notebooks/:notebookId/messages → load chat history
chatRouter.get('/notebooks/:notebookId/messages', async (req, res) => {
  const notebookId = String(req.params.notebookId ?? '')
  res.json(await listMessages(notebookId))
})

// POST /api/notebooks/:notebookId/chat → ask a question
chatRouter.post('/notebooks/:notebookId/chat', async (req, res) => {
  const notebookId = String(req.params.notebookId ?? '')
  const question = String(req.body.question ?? '').trim()
  if (!question) return res.status(400).json({ error: 'question required' })

  try {
    // 1) save the user's message
    await saveMessage({ notebookId, role: 'user', content: question })

    // 2) generate a grounded answer
    const { answer, citations } = await answerQuestion(notebookId, question)

    // 3) save + return the assistant's message
    const assistant = await saveMessage({
      notebookId, role: 'assistant', content: answer, citations,
    })
    res.json(assistant)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
})