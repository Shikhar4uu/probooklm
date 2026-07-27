import { YoutubeTranscript } from 'youtube-transcript'

/** Formats milliseconds as [HH:MM:SS] or [MM:SS] */
function stamp(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `[${pad(h)}:${pad(m)}:${pad(s)}]` : `[${pad(m)}:${pad(s)}]`
}

export async function extractYoutube(url: string): Promise<string> {
  if (!url) throw new Error('No URL provided for YouTube source')

  let items
  try {
    items = await YoutubeTranscript.fetchTranscript(url)
  } catch (err: any) {
    throw new Error(
      `Could not fetch transcript: ${err?.message ?? err}. The video may have captions disabled.`
    )
  }

  if (!items?.length) {
    throw new Error('This video has no transcript/captions available.')
  }

  // Group into ~20-second blocks so timestamps stay readable
  const lines: string[] = []
  let bucketStart = items[0].offset
  let bucket: string[] = []

  for (const item of items) {
    const clean = item.text.replace(/\s+/g, ' ').trim()
    if (!clean) continue

    if (item.offset - bucketStart > 20000 && bucket.length) {
      lines.push(`${stamp(bucketStart)} ${bucket.join(' ')}`)
      bucket = []
      bucketStart = item.offset
    }
    bucket.push(clean)
  }
  if (bucket.length) lines.push(`${stamp(bucketStart)} ${bucket.join(' ')}`)

  return lines.join('\n')
}