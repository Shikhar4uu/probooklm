import type { SourceType } from '../../../../shared/types.js'
import { extractTextSource } from './text.js'
import { extractPdf } from './pdf.js'
import { extractWebsite } from './website.js'
import { extractYoutube } from './youtube.js'
import { extractVtt } from './vtt.js'

export type ExtractInput = {
  text?: string
  buffer?: Buffer
  url?: string
}

export type ExtractResult = {
  text: string
  pageCount?: number
}

export type Extractor = (
  input: ExtractInput
) => Promise<ExtractResult> | ExtractResult

/**
 * Map of source type -> extractor.
 * pipeline.ts does: const extractor = extractors[source.type as SourceType]
 */
export const extractors: Partial<Record<SourceType, Extractor>> = {
  /* Existing two already accept ExtractInput and return { text, pageCount } */
  text: extractTextSource,
  pdf: extractPdf,

  /* New three return plain strings, so we adapt them here */
  website: async (input) => ({
    text: await extractWebsite(input.url ?? ''),
  }),

  youtube: async (input) => ({
    text: await extractYoutube(input.url ?? ''),
  }),

  vtt: (input) => ({
    text: extractVtt(input.text ?? input.buffer?.toString('utf-8') ?? ''),
  }),
}