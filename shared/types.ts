// shared/types.ts

// The Locator is the "address" of a chunk inside its original source.
// This is what makes "click a citation → jump to the exact spot" possible.
export type Locator =
  | { type: 'pdf';     page: number; charStart: number; charEnd: number }
  | { type: 'youtube'; startSec: number; endSec: number }
  | { type: 'vtt';     cueStart: number; cueEnd: number; cueIndex: number }
  | { type: 'web';     anchor?: string; charStart: number; charEnd: number }
  | { type: 'text';    charStart: number; charEnd: number }

export type SourceType   = 'pdf' | 'text' | 'web' | 'youtube' | 'vtt'
export type SourceStatus = 'uploading' | 'extracting' | 'indexing' | 'ready' | 'failed'

export interface Notebook {
  id: string
  title: string
  icon?: string
  createdAt: string
}

export interface Source {
  id: string
  notebookId: string
  type: SourceType
  title: string
  status: SourceStatus
  originUri?: string
  error?: string
}

export interface Chunk {
  id: string
  sourceId: string
  notebookId: string
  content: string
  locator: Locator
  chunkIndex: number
}