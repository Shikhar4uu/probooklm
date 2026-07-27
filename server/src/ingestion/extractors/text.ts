export function extractTextSource(input: { text?: string }) {
  return { text: (input.text ?? '').trim(), pageCount: 1 }
}