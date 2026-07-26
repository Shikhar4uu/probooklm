import { openai } from '../infra/openai.js'

// Turn an array of texts into an array of 1536-dim vectors.
export async function embed(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return res.data.map(d => d.embedding)
}