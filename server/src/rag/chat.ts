// server/src/rag/chat.ts
import { chatClient, CHAT_MODEL } from '../infra/openai.js'
import { embed } from '../ingestion/embeddings.js'
import { retrieveChunks } from './retrieval.js'
import { buildMessages } from './prompt.js'

export interface Citation {
  n: number
  chunkId: string
  sourceId: string
  sourceTitle: string
  locator: unknown
  snippet: string
}

export async function answerQuestion(notebookId: string, question: string) {
  // 1) Embed the question (same model + dimensions as the chunks!)
  const [queryEmbedding] = await embed([question])

  // 2) Retrieve top chunks (isolated to this notebook)
  const chunks = await retrieveChunks(notebookId, queryEmbedding, 6)

  // 3) Build the grounded prompt
  const messages = buildMessages(question, chunks)

  // 4) Ask the LLM via OpenRouter
  const completion = await chatClient.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.2,
  })
  const answer = completion.choices[0]?.message?.content ?? ''

  // 5) Package citations for clickable chips
  const citations: Citation[] = chunks.map((c, i) => ({
    n: i + 1,
    chunkId: c.id,
    sourceId: c.sourceId,
    sourceTitle: c.sourceTitle,
    locator: c.locator,
    snippet: c.content.slice(0, 240),
  }))

  return { answer, citations }
}