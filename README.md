> **ProbookLM** — a NotebookLM-style AI research assistant that answers only from *your* sources, and proves it with click-to-source citations.
Live: https://probooklm.vercel.app
> 

<aside>
🎯

**Status:** Phase 1 shipped — notebooks, multi-format ingestion, grounded RAG chat with citations, 3-pane UI, dark mode, deployed. Phase 2 (edge features) in progress.

</aside>

---

## What it does

Upload documents, links, videos or captions into a **notebook**, then ask questions. Every answer is grounded in your sources — no outside knowledge, no hallucinated facts — and every claim carries a `[n]` citation you can click to jump to the exact page, timestamp or character range it came from.

If the sources don't contain the answer, it says so instead of guessing.

## Features

| Feature | Status |
| --- | --- |
| Multi-notebook workspace with rename / delete | ✅ |
| Source ingestion — PDF, Text, Web URL, YouTube, VTT captions | ✅ |
| Live status dots (🟡 indexing → 🟢 ready) | ✅ |
| Grounded RAG chat with `[n]` citations | ✅ |
| Click-to-source viewer | ✅ |
| Per-notebook isolation (no cross-notebook leakage) | ✅ |
| 3-pane responsive UI + dark mode | ✅ |

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React + Vite + TypeScript |
| Backend | Express + TypeScript |
| Database | PostgreSQL + `pgvector` (HNSW index) |
| Chat model | `deepseek/deepseek-v4-flash:free` via OpenRouter |
| Embeddings | `gemini-embedding-001` @ 768 dims |
| SDK | OpenAI SDK for both providers (swapped `baseURL`) |
| Hosting | Vercel (client) · Render (API) · Neon (Postgres) |

## Architecture

```
┌──────────────── Vercel ────────────────┐
│  React + Vite                          │
│  ┌─────────┬──────────┬─────────────┐  │
│  │ Sources │   Chat   │   Studio    │  │
│  └─────────┴──────────┴─────────────┘  │
└──────────────────┬─────────────────────┘
                   │  REST + SSE
┌──────────────────▼───── Render ────────┐
│  Express + TypeScript                  │
│                                        │
│  ingestion/   extract → chunk → embed  │
│  retrieval/   embed q → search → rank  │
│  chat/        prompt → stream → cite   │
│  infra/llm/   provider router          │
└──────────────────┬─────────────────────┘
                   │
        ┌──────────▼──────────┐        ┌─────────────────┐
        │  Neon Postgres      │        │  OpenRouter     │
        │  + pgvector (768)   │        │  Gemini         │
        └─────────────────────┘        └─────────────────┘
```

### The RAG pipeline

1. **Extract** — source-specific plugin pulls text plus a `Locator` for every fragment
2. **Chunk** — ~800 tokens, ~15% overlap, locators preserved
3. **Embed** — batched 100-at-a-time into 768-dim vectors
4. **Store** — `chunks` table, HNSW cosine index, tagged with `notebook_id`
5. **Retrieve** — embed the question, cosine top-k scoped to the active notebook
6. **Prompt** — numbered context block + strict grounding rules
7. **Stream** — tokens over SSE with automatic model failover
8. **Cite** — parse `[n]` markers, validate, persist to `citations`

### The Locator — why citations land exactly

Every chunk stores *where it came from*, not just which file:

```tsx
type Locator =
  | { kind: 'pdf';     page: number; charStart: number; charEnd: number; bbox?: number[] }
  | { kind: 'youtube'; startSec: number; endSec: number }
  | { kind: 'vtt';     cueStart: number; cueEnd: number; cueIndex: number }
  | { kind: 'web';     anchor?: string; charStart: number; charEnd: number }
  | { kind: 'text';    charStart: number; charEnd: number }
```

This is what turns a citation from "somewhere in this 40-page PDF" into "page 12, this paragraph" — or scrubs a YouTube video to the exact second.

## Project structure

```
probooklm/
├── client/
│   └── src/
│       ├── App.tsx                 # 3-pane shell
│       ├── App.css                 # design tokens + layout
│       ├── components/             # ThemeToggle, primitives
│       ├── features/
│       │   ├── sources/            # SourcesPanel
│       │   └── chat/               # ChatPanel, bubbles, citations
│       └── lib/api.ts              # typed fetch client
│
└── server/
    └── src/
        ├── index.ts                # express app, CORS, routes
        ├── config/env.ts           # zod-validated env
        ├── infra/
        │   ├── db.ts               # pg pool
        │   └── llm/
        │       ├── providers.ts    # OpenRouter + Gemini clients
        │       ├── chat.ts         # streaming + failover
        │       └── embeddings.ts   # batched, normalized
        ├── modules/
        │   ├── ingestion/          # extract → chunk → embed
        │   ├── retrieval/          # vector search
        │   └── chat/               # prompt, citations, SSE route
        ├── plugins/sources/        # pdf · text · web · youtube · vtt
        ├── routes/health.ts        # health + provider checks
        └── scripts/verify.ts       # pre-flight sanity checks
```

---

## Getting started

### Prerequisites

- Node 20+
- A PostgreSQL database with `pgvector` (Neon free tier works)
- An OpenRouter API key (free)
- A Google AI Studio API key (free)

### 1. Clone and install

```bash
git clone https://github.com/<you>/probooklm.git
cd probooklm

cd server && npm install
cd ../client && npm install
```

### 2. Configure the server

`server/.env`

```bash
OPENROUTER_API_KEY=sk-or-v1-xxxx
GEMINI_API_KEY=AIzaxxxx
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
CLIENT_URL=http://localhost:5173
PORT=3000
USE_NATIVE_GEMINI_EMBED=false
```

### 3. Configure the client

`client/.env`

```bash
VITE_API_URL=http://localhost:3000
```

<aside>
⚠️

Vite inlines env vars at **build** time. Changing `VITE_API_URL` requires a rebuild — in production, a full redeploy.

</aside>

### 4. Create the schema

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

### 5. Verify your providers

```bash
cd server && npx tsx src/scripts/verify.ts
```

Expected:

```
dims        : 768 ✅
cat~kitten  : 0.812  (want > 0.7)
cat~engine  : 0.341  (want < 0.5)
chat        : OK
```

<aside>
🚨

If every pair scores ~0.99, normalization or the `dimensions` param failed silently. Fix it **before** embedding anything — re-indexing later means re-embedding every chunk.

</aside>

### 6. Run

```bash
cd server && npm run dev     # :3000
cd client && npm run dev     # :5173
```

---

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | server | Chat completions |
| `GEMINI_API_KEY` | server | Embeddings |
| `DATABASE_URL` | server | Postgres + pgvector |
| `CLIENT_URL` | server | CORS allowlist — **no trailing slash** |
| `PORT` | server | Render injects this |
| `USE_NATIVE_GEMINI_EMBED` | server | `true` enables asymmetric embeddings |
| `VITE_API_URL` | client | API base — **no trailing slash** |

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server, DB, pgvector, env presence |
| `GET` | `/api/health/providers` | Live provider check (uses quota) |
| `GET` | `/notebooks` | List notebooks |
| `POST` | `/notebooks` | Create |
| `PATCH` | `/notebooks/:id` | Rename |
| `DELETE` | `/notebooks/:id` | Delete + cascade |
| `GET` | `/notebooks/:id/sources` | List sources with status |
| `POST` | `/notebooks/:id/sources` | Add source, kicks off indexing |
| `DELETE` | `/sources/:id` | Remove + drop its chunks |
| `POST` | `/notebooks/:id/chat` | SSE: `sources` → `token`  • → `done` |

## Database schema

```sql
notebooks (id, title, icon, created_at, updated_at)
sources   (id, notebook_id, type, title, status, origin_uri,
           metadata, error, content_hash, ...)
chunks    (id, source_id, notebook_id, content,
           embedding VECTOR(768), locator JSONB, chunk_index)
messages  (id, notebook_id, role, content, created_at)
citations (id, message_id, chunk_id, marker_index, quote)
```

```sql
CREATE INDEX chunks_embedding_idx ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX chunks_notebook_idx  ON chunks (notebook_id);
```

<aside>
🔒

`VECTOR(768)` is locked to `gemini-embedding-001` at 768 dimensions. Changing the model or dimension count requires re-embedding **every** row.

</aside>

## Deployment

**Client → Vercel**

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Env | `VITE_API_URL=https://<api>.onrender.com` |

**Server → Render**

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Env | all server vars, `CLIENT_URL` = exact Vercel URL |

Bind to `0.0.0.0` and use `process.env.PORT`, or Render's port scan will time out.

---

## Troubleshooting

**UI does nothing, but requests appear in Render logs**

CORS. Almost always a trailing slash on `CLIENT_URL`. The browser sends `Origin` without one, so the string compare fails and the browser discards a perfectly good response. Strip trailing slashes on both sides and make sure preflight `OPTIONS` is handled.

**Requests go to localhost in production**

`VITE_API_URL` was set after the build. Vite inlines env vars at build time — redeploy.

**First request hangs about 50 seconds**

Render free tier cold start. Ping `/api/health` on app load so the backend wakes while the user reads the UI.

**Chat streams nothing, other routes fine**

SSE buffering. Set `X-Accel-Buffering: no`, use `Cache-Control: no-cache, no-transform`, and never put `compression()` on the stream route.

**Chat pane will not scroll**

A flex ancestor is missing `min-height: 0`, so it grows to fit content instead of scrolling. The scroll container needs `flex: 1; min-height: 0; overflow-y: auto` and every flex ancestor needs `min-height: 0`.

**429 from the chat model**

Daily free-tier cap. The failover chain covers momentary limits; a hard cap needs a Groq fallback key or 10 dollars of OpenRouter credit, which raises the free-model limit from 50 to 1,000 requests per day.

## Roadmap

**Next**

- Retrieval eval harness — recall@k + MRR against a hand-labelled set
- Reranking (top-20 → top-6)
- Hybrid search: vector + full-text fused with RRF

**Then**

- Sentence-level grounding badges (grounded / partial / unsupported)
- Insight Radar — cross-source contradiction detection
- Knowledge Graph with clickable, grounded entities
- Audio Overview (two-voice podcast)
- Learning Roadmap generator

## Notes

Both providers are used on their free tiers, which reserve the right to train on submitted content. Fine for public documents and test material; switch to paid tiers before putting confidential data through it.

---

*Built with React, Express, PostgreSQL and pgvector.*