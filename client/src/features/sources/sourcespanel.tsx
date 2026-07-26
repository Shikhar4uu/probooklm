// client/src/features/sources/SourcesPanel.tsx
import { useEffect, useState } from 'react'
import { sourcesApi, type Source } from '../../lib/api'

const DOT: Record<string, string> = {
  uploading: '⚪',
  extracting: '🟡',
  indexing: '🟡',
  ready: '🟢',
  failed: '🔴',
}

export default function SourcesPanel({ notebookId }: { notebookId: string }) {
  const [sources, setSources] = useState<Source[]>([])

  // Poll every 2s so status dots update on their own
  useEffect(() => {
    let alive = true
    const load = () =>
      sourcesApi.list(notebookId).then(s => { if (alive) setSources(s) })
    load()
    const timer = setInterval(load, 2000)
    return () => { alive = false; clearInterval(timer) }
  }, [notebookId])

  async function addText() {
    const title = prompt('Source title?')
    if (!title) return
    const text = prompt('Paste text:')
    if (!text) return
    const s = await sourcesApi.addText(notebookId, title, text)
    setSources(prev => [s, ...prev])
  }

  async function addPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const s = await sourcesApi.addPdf(notebookId, file.name, file)
    setSources(prev => [s, ...prev])
    e.target.value = '' // allow re-selecting the same file
  }

  async function removeSource(id: string) {
    await sourcesApi.remove(id)
    setSources(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div>
      <div className="src-actions">
        <button className="src-add" onClick={addText}>＋ Text</button>
        <label className="src-add">
          ＋ PDF
          <input type="file" accept="application/pdf" hidden onChange={addPdf} />
        </label>
      </div>

      {sources.length === 0 && <p className="muted">No sources yet.</p>}

      <div className="src-list">
        {sources.map(s => (
          <div key={s.id} className="src-row">
            <span className="src-dot">{DOT[s.status] ?? '⚪'}</span>
            <span className="src-name" title={s.error ?? s.status}>{s.title}</span>
            {s.status === 'failed' && (
              <button title="Retry" onClick={() => sourcesApi.reindex(s.id)}>🔄</button>
            )}
            <button title="Remove" onClick={() => removeSource(s.id)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  )
}