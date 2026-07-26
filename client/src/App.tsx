// client/src/App.tsx
import { useEffect, useState } from 'react'
import { notebooksApi, type Notebook } from './lib/api'
import SourcesPanel from './features/sources/sourcespanel'
import ChatPanel from './features/chat/chatpanel'
import './App.css'

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => { notebooksApi.list().then(setNotebooks) }, [])

  async function submitCreate() {
    const title = newTitle.trim()
    if (!title) { setCreating(false); return }
    const nb = await notebooksApi.create(title)
    setNotebooks(prev => [nb, ...prev])
    setActiveId(nb.id)
    setNewTitle(''); setCreating(false); setMenuOpen(false)
  }

  async function handleRename(nb: Notebook) {
    const title = prompt('Rename notebook', nb.title)
    if (!title) return
    const updated = await notebooksApi.rename(nb.id, title)
    setNotebooks(prev => prev.map(n => (n.id === nb.id ? updated : n)))
  }

  async function handleDelete(nb: Notebook) {
    if (!confirm(`Delete "${nb.title}"? This removes all its sources.`)) return
    await notebooksApi.remove(nb.id)
    setNotebooks(prev => prev.filter(n => n.id !== nb.id))
    if (activeId === nb.id) setActiveId(null)
  }

  const active = notebooks.find(n => n.id === activeId) ?? null

  return (
    <div className="app">
      <header className="topbar">
        <button className="menu-btn" onClick={() => setMenuOpen(o => !o)}>☰</button>
        <span className="brand">📘 ProbookLM</span>
      </header>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

      {/* LEFT — Notebooks + Sources */}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand brand-desktop">📘 ProbookLM</div>

        <button className="create-btn" onClick={() => setCreating(true)}>
          <span className="plus">＋</span> Create new
        </button>

        {creating && (
          <input
            className="create-input"
            autoFocus
            placeholder="Notebook name…"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') submitCreate()
              if (e.key === 'Escape') { setCreating(false); setNewTitle('') }
            }}
            onBlur={submitCreate}
          />
        )}

        <div className="section-label">Recent notebooks</div>

        {notebooks.length === 0 && !creating && (
          <div className="empty-mini">No notebooks yet.<br />Click “Create new”.</div>
        )}

        <div className="nb-list">
          {notebooks.map(nb => (
            <div
              key={nb.id}
              className={`nb-card ${nb.id === activeId ? 'active' : ''}`}
              onClick={() => { setActiveId(nb.id); setMenuOpen(false) }}
            >
              <div className="nb-icon">{nb.icon ?? '📓'}</div>
              <div className="nb-meta">
                <div className="nb-title">{nb.title}</div>
                <div className="nb-date">
                  {new Date(nb.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div className="nb-actions">
                <button title="Rename" onClick={e => { e.stopPropagation(); handleRename(nb) }}>✏️</button>
                <button title="Delete" onClick={e => { e.stopPropagation(); handleDelete(nb) }}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        {/* Sources for the active notebook */}
        {active && (
          <>
            <div className="section-label">Sources · {active.title}</div>
            <SourcesPanel notebookId={active.id} />
          </>
        )}
      </aside>

      {/* CENTER — Chat */}
      <main className="main">
        {active ? (
          <div className="chat-wrap">
            <div className="chat-head">
              <div className="chat-emoji">{active.icon ?? '📓'}</div>
              <div>
                <h1 className="chat-title">{active.title}</h1>
                <p className="chat-sub">grounded in your sources</p>
              </div>
            </div>
            <ChatPanel key={active.id} notebookId={active.id} />
          </div>
        ) : (
          <div className="welcome">
            <div className="welcome-icon">📘</div>
            <h1>Welcome to ProbookLM</h1>
            <p className="muted">Select a notebook on the left, or create a new one to begin.</p>
          </div>
        )}
      </main>

      {/* RIGHT — Studio / Viewer */}
      <aside className="viewer">
        <h2 className="panel-title">Studio</h2>
        <div className="studio-card">
          <div className="studio-emoji">🎧</div>
          <div>
            <div className="studio-name">Audio Overview</div>
            <div className="muted">Coming soon</div>
          </div>
        </div>
        <div className="studio-card">
          <div className="studio-emoji">🕸</div>
          <div>
            <div className="studio-name">Knowledge Graph</div>
            <div className="muted">Coming soon</div>
          </div>
        </div>
        <h2 className="panel-title" style={{ marginTop: 20 }}>Source Viewer</h2>
        <p className="muted">Click a citation to open its source here.</p>
      </aside>
    </div>
  )
}