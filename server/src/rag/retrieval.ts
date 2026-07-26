// server/src/rag/retrieval.ts
import { query } from '../infra/db.js'

export interface RetrievedChunk {
  id: string
  content: string
  sourceId: string
  sourceTitle: string
  locator: unknown
  similarity: number
}

export async function retrieveChunks(
  notebookId: string,
  queryEmbedding: number[],
  k = 6,
): Promise<RetrievedChunk[]> {
  const vec = `[${queryEmbedding.join(',')}]` // pgvector text format

  const { rows } = await query(
    `SELECT c.id,
            c.content,
            c.source_id            AS "sourceId",
            s.title                AS "sourceTitle",
            c.locator,
            1 - (c.embedding <=> $1::vector) AS similarity
     FROM chunks c
     JOIN sources s ON s.id = c.source_id
     WHERE c.notebook_id = $2
     ORDER BY c.embedding <=> $1::vector
     LIMIT $3`,
    [vec, notebookId, k],
  )

  return rows as RetrievedChunk[]
}