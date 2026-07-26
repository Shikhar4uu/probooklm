// server/src/rag/prompt.ts
import type { RetrievedChunk } from './retrieval.js'

export function buildMessages(question: string, chunks: RetrievedChunk[]) {
  const context = chunks
    .map((c, i) => `[${i + 1}] (Source: ${c.sourceTitle})\n${c.content}`)
    .join('\n\n')

  const system = `You are ProbookLM, a precise research assistant.
Answer the user's question using ONLY the numbered SOURCES below.
Cite every claim with its source number in square brackets, e.g. [1] or [2][3].
If the answer is not contained in the sources, reply exactly:
"I couldn't find that in your sources."
Never use outside knowledge. Be concise and clear.

SOURCES:
${context || '(no sources available)'}`

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: question },
  ]
}