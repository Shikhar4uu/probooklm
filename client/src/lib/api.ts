// client/src/lib/api.ts
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ---------- Types ----------
export interface Notebook {
  id: string;
  title: string;
  icon?: string;
  createdAt: string;
}

export interface Source {
  id: string;
  notebookId: string;
  type: string;
  title: string;
  status: "uploading" | "extracting" | "indexing" | "ready" | "failed";
  error?: string;
}

// ---------- Notebooks ----------
export const notebooksApi = {
  list: (): Promise<Notebook[]> =>
    fetch(`${API}/api/notebooks`).then((r) => r.json()),

  create: (title: string): Promise<Notebook> =>
    fetch(`${API}/api/notebooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).then((r) => r.json()),

  rename: (id: string, title: string): Promise<Notebook> =>
    fetch(`${API}/api/notebooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).then((r) => r.json()),

  remove: (id: string): Promise<void> =>
    fetch(`${API}/api/notebooks/${id}`, { method: "DELETE" }).then(() => {}),
};

// ---------- Sources ----------
export const sourcesApi = {
  list: (notebookId: string): Promise<Source[]> =>
    fetch(`${API}/api/notebooks/${notebookId}/sources`).then((r) => r.json()),

  addText: (notebookId: string, title: string, text: string): Promise<Source> =>
    fetch(`${API}/api/notebooks/${notebookId}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", title, text }),
    }).then((r) => r.json()),

  addPdf: (notebookId: string, title: string, file: File): Promise<Source> => {
    const fd = new FormData();
    fd.append("type", "pdf");
    fd.append("title", title);
    fd.append("file", file);
    return fetch(`${API}/api/notebooks/${notebookId}/sources`, {
      method: "POST",
      body: fd, // no Content-Type header — the browser sets the multipart boundary
    }).then((r) => r.json());
  },

  remove: (id: string): Promise<void> =>
    fetch(`${API}/api/sources/${id}`, { method: "DELETE" }).then(() => {}),

  reindex: (id: string): Promise<void> =>
    fetch(`${API}/api/sources/${id}/reindex`, { method: "POST" }).then(
      () => {},
    ),

  addUrl: async (
    notebookId: string,
    type: "website" | "youtube",
    url: string,
  ): Promise<Source> => {
    const fd = new FormData();
    fd.append("type", type);
    fd.append("url", url);

    const r = await fetch(`${API}/api/notebooks/${notebookId}/sources`, {
      method: "POST",
      body: fd,
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? `Failed (${r.status})`);
    return data as Source;
  },

  addCaptions: async (
    notebookId: string,
    title: string,
    file: File,
  ): Promise<Source> => {
    const fd = new FormData();
    fd.append("type", "vtt");
    fd.append("title", title);
    fd.append("file", file);

    const r = await fetch(`${API}/api/notebooks/${notebookId}/sources`, {
      method: "POST",
      body: fd,
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? `Failed (${r.status})`);
    return data as Source;
  },
};

export interface Citation {
  n: number;
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  locator: unknown;
  snippet: string;
}

export interface Message {
  id: string;
  notebookId: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export const chatApi = {
  history: (notebookId: string): Promise<Message[]> =>
    fetch(`${API}/api/notebooks/${notebookId}/messages`).then((r) => r.json()),

  ask: async (notebookId: string, question: string): Promise<Message> => {
    const r = await fetch(`${API}/api/notebooks/${notebookId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await r.json();
    if (!r.ok || !data?.content) {
      throw new Error(data?.error ?? `Request failed (${r.status})`);
    }
    return data as Message;
  },
};
