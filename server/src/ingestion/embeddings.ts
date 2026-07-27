// server/src/ingestion/embeddings.ts
import {
  embeddingsClient,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from '../infra/openai.js'

// Turn an array of texts into 1536-dim vectors using gemini-embedding-001.
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  try {
    // Fast path: one batched request
    const res = await embeddingsClient.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS, // truncate 3072 → 1536
    })
    return res.data.map(d => d.embedding)
  } catch {
    // Fallback: some compat layers reject arrays — embed one at a time
    const out: number[][] = []
    for (const text of texts) {
      const res = await embeddingsClient.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      })
      out.push(res.data[0].embedding)
    }
    return out
  }
}