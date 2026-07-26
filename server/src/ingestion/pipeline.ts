import { prisma } from '../infra/db.js'
import { query } from '../infra/db.js'
import { extractors, type ExtractInput } from './extractors/registry.js'
import { chunkText } from './chunker.js'
import { embed } from './embeddings.js'
import type { SourceType } from '../../../shared/types.js'

// Runs in the background — NOT awaited by the route, so the UI returns instantly.
export async function ingestSource(sourceId: string, input: ExtractInput) {
  try {
    const source = await prisma.source.update({
      where: { id: sourceId },
      data: { status: 'extracting' },
    })

    // 1) EXTRACT
    const extractor = extractors[source.type as SourceType]
    if (!extractor) throw new Error(`No extractor for type: ${source.type}`)
    const { text, pageCount } = await extractor(input)
    if (!text) throw new Error('No text could be extracted')

    // 2) CHUNK
    await prisma.source.update({ where: { id: sourceId }, data: { status: 'indexing' } })
    const chunks = chunkText(text, source.type as SourceType, pageCount)

    // 3) EMBED (batched)
    const vectors = await embed(chunks.map(c => c.content))

    // 4) STORE (raw SQL — Prisma can't write vector columns)
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      await query(
        `INSERT INTO chunks (source_id, notebook_id, content, embedding, locator, chunk_index)
         VALUES ($1, $2, $3, $4::vector, $5::jsonb, $6)`,
        [
          sourceId,
          source.notebookId,
          c.content,
          `[${vectors[i].join(',')}]`,      // pgvector text format
          JSON.stringify(c.locator),
          c.index,
        ],
      )
    }

    // 5) READY
    await prisma.source.update({ where: { id: sourceId }, data: { status: 'ready', error: null } })
  } catch (err) {
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: 'failed', error: String(err) },
    })
  }
}