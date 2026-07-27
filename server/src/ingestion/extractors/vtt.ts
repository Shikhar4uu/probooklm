/** Parses a WebVTT / SRT caption file into timestamped plain text. */
export function extractVtt(raw: string): string {
  if (!raw?.trim()) throw new Error('Caption file is empty')

  const blocks = raw.replace(/\r/g, '').split(/\n\n+/)
  const lines: string[] = []

  for (const block of blocks) {
    const rows = block.split('\n').filter(Boolean)
    if (!rows.length) continue
    if (/^WEBVTT/i.test(rows[0])) continue

    const timeRow = rows.find((r) => r.includes('-->'))
    if (!timeRow) continue

    const start = timeRow.split('-->')[0].trim().split('.')[0].split(',')[0]
    // Trim a leading "00:" so short clips read as [MM:SS]
    const shown = start.startsWith('00:') ? start.slice(3) : start

    const text = rows
      .filter((r) => !r.includes('-->') && !/^\d+$/.test(r.trim()))
      .join(' ')
      .replace(/<[^>]+>/g, '')      // strip inline caption tags
      .replace(/\s+/g, ' ')
      .trim()

    if (text) lines.push(`[${shown}] ${text}`)
  }

  if (!lines.length) throw new Error('No captions found in file')
  return lines.join('\n')
}