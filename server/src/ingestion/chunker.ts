import type { Locator, SourceType } from '../../../shared/types.js'

export interface Chunk { content: string; locator: Locator; index: number }

// ~800 tokens ≈ 3200 chars; ~15% overlap ≈ 480 chars
const SIZE = 3200
const OVERLAP = 480

// Char-based chunking for text / pdf / web
export function chunkText(
  text: string,
  sourceType: SourceType,
  pageCount = 1,
): Chunk[] {
  const chunks: Chunk[] = []
  let start = 0
  let index = 0
  const total = text.length

  while (start < total) {
    const end = Math.min(start + SIZE, total)
    const content = text.slice(start, end)

    let locator: Locator
    if (sourceType === 'pdf') {
      // rough page estimate from character position (good enough for MVP jump-to-page)
      const page = Math.floor((start / total) * pageCount) + 1
      locator = { type: 'pdf', page, charStart: start, charEnd: end }
    } else if (sourceType === 'web') {
      locator = { type: 'web', charStart: start, charEnd: end }
    } else {
      locator = { type: 'text', charStart: start, charEnd: end }
    }

    chunks.push({ content, locator, index: index++ })
    if (end === total) break
    start = end - OVERLAP   // step back for overlap
  }
  return chunks
}