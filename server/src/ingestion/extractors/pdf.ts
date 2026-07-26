// server/src/ingestion/extractors/pdf.ts
import { extractText, getDocumentProxy } from 'unpdf'

export async function extractPdf(input: { buffer?: Buffer }) {
  if (!input.buffer) throw new Error('No PDF file provided')

  const pdf = await getDocumentProxy(new Uint8Array(input.buffer))
  const { text, totalPages } = await extractText(pdf, { mergePages: true })

  return { text: text.trim(), pageCount: totalPages || 1 }
}