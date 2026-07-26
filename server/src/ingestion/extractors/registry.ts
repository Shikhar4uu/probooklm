import { extractText } from './text.js'
import { extractPdf } from './pdf.js'
import type { SourceType } from '../../../../shared/types.js'

export interface ExtractInput { text?: string; buffer?: Buffer; url?: string }
export interface ExtractResult { text: string; pageCount: number }

type Extractor = (input: ExtractInput) => ExtractResult | Promise<ExtractResult>

export const extractors: Partial<Record<SourceType, Extractor>> = {
  text: extractText,
  pdf: extractPdf,
  // web, youtube, vtt → Phase 3b
}