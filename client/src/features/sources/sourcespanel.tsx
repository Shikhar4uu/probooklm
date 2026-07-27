// client/src/features/sources/SourcesPanel.tsx
import { useEffect, useState } from "react";
import { sourcesApi, type Source } from "../../lib/api";

const DOT: Record<string, string> = {
  uploading: "⚪",
  extracting: "🟡",
  indexing: "🟡",
  ready: "🟢",
  failed: "🔴",
};

const TYPE_ICON: Record<string, string> = {
  text: "📝",
  pdf: "📄",
  website: "🌐",
  youtube: "▶️",
  vtt: "💬",
};

function isYoutubeUrl(url: string) {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

export default function SourcesPanel({ notebookId }: { notebookId: string }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [urlValue, setUrlValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll every 2s so status dots update on their own
  useEffect(() => {
    let alive = true;
    const load = () =>
      sourcesApi
        .list(notebookId)
        .then((s) => {
          if (alive) setSources(s);
        })
        .catch(() => {
          /* ignore transient poll errors */
        });
    load();
    const timer = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [notebookId]);

  async function addText() {
    const title = prompt("Source title?");
    if (!title) return;
    const text = prompt("Paste text:");
    if (!text) return;
    try {
      const s = await sourcesApi.addText(notebookId, title, text);
      setSources((prev) => [s, ...prev]);
    } catch (err) {
      setError(String(err));
    }
  }

  async function addPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const s = await sourcesApi.addPdf(notebookId, file.name, file);
      setSources((prev) => [s, ...prev]);
    } catch (err) {
      setError(String(err));
    }
    e.target.value = ""; // allow re-selecting the same file
  }

  async function addCaptions(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const s = await sourcesApi.addCaptions(notebookId, file.name, file);
      setSources((prev) => [s, ...prev]);
    } catch (err) {
      setError(String(err));
    }
    e.target.value = "";
  }

  async function addUrl() {
    const url = urlValue.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      setError("Please paste a full URL starting with http:// or https://");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const type = isYoutubeUrl(url) ? "youtube" : "website";
      const s = await sourcesApi.addUrl(notebookId, type, url);
      setSources((prev) => [s, ...prev]);
      setUrlValue("");
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeSource(id: string) {
    try {
      await sourcesApi.remove(id);
      setSources((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div>
      {/* Website / YouTube link input */}
      <div className="src-url-row">
        <input
          className="src-url-input"
          placeholder="Paste a website or YouTube link…"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addUrl();
          }}
          disabled={busy}
        />
        <button
          className="src-url-btn"
          onClick={addUrl}
          disabled={busy || !urlValue.trim()}
        >
          {busy ? "…" : "Add"}
        </button>
      </div>

      {urlValue.trim() !== "" && (
        <p className="src-hint">
          {isYoutubeUrl(urlValue)
            ? "▶️ Detected YouTube video"
            : "🌐 Detected website"}
        </p>
      )}

      {/* File / text buttons */}
      <div className="src-actions">
        <button className="src-add" onClick={addText}>
          <span className="src-add-icon">📝</span>
          Text
        </button>

        <label className="src-add">
          <span className="src-add-icon">📄</span>
          PDF
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={addPdf}
          />
        </label>

        <label className="src-add">
          <span className="src-add-icon">💬</span>
          Captions
          <input type="file" accept=".vtt,.srt" hidden onChange={addCaptions} />
        </label>
      </div>

      {error && (
        <div className="src-error">
          <span>⚠️ {error}</span>
          <button className="src-error-x" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      {sources.length === 0 && <p className="muted">No sources yet.</p>}

      <div className="src-list">
        {sources.map((s) => (
          <div key={s.id} className="src-row">
            <span className="src-dot">{DOT[s.status] ?? "⚪"}</span>
            <span className="src-type">{TYPE_ICON[s.type] ?? "📄"}</span>
            <span className="src-name" title={s.error ?? s.status}>
              {s.title}
            </span>
            {s.status === "failed" && (
              <button
                title={s.error ?? "Retry"}
                onClick={() => sourcesApi.reindex(s.id)}
              >
                🔄
              </button>
            )}
            <button title="Remove" onClick={() => removeSource(s.id)}>
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
