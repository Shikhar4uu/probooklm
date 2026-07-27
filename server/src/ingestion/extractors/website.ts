import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'

export async function extractWebsite(url: string): Promise<string> {
  if (!url) throw new Error('No URL provided for website source')

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch page (${res.status} ${res.statusText})`)
  }

  const html = await res.text()
  const dom = new JSDOM(html, { url })
  const article = new Readability(dom.window.document).parse()

  const text = (article?.textContent ?? '').trim()

  if (text.length < 50) {
    throw new Error(
      'Could not extract readable text. The page may be JavaScript-rendered or paywalled.'
    )
  }

  const title = article?.title ? `${article.title}\n\n` : ''
  return title + text
}