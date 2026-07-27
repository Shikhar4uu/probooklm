import OpenAI from 'openai'
import { env } from '../config/env.js'

/* Startup diagnostics — remove once chat works */
console.log('[openai] GEMINI key length  :', (env.GEMINI_API_KEY ?? '').length)
console.log('[openai] DEEPSEEK key length:', (env.OPENROUTER_API_KEY ?? '').length)

if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim().length < 20) {
  throw new Error('GEMINI_API_KEY is missing. Check server/.env')
}
if (!env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY.trim().length < 20) {
  throw new Error('OPENROUTER_API_KEY is missing. Check server/.env')
}

/* ------------------------------------------------------------------
   Embeddings — Google Gemini (OpenAI-compatible endpoint)
------------------------------------------------------------------ */
export const embeddingsClient = new OpenAI({
  apiKey: env.GEMINI_API_KEY.trim(),
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

/* ------------------------------------------------------------------
   Chat — DeepSeek direct API (OpenAI-compatible)
------------------------------------------------------------------ */
export const chatClient = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY.trim(),
  baseURL: "https://integrate.api.nvidia.com/v1",   // ← the actual fix
})

/* ------------------------------------------------------------------
   Models
------------------------------------------------------------------ */
export const EMBEDDING_MODEL = 'gemini-embedding-001'
export const EMBEDDING_DIMENSIONS = 1536

/**
 * DeepSeek's own model IDs are short — no "deepseek/" prefix, no ":free".
 * Options: 'deepseek-chat' (fast, general) or 'deepseek-reasoner' (slower, thinks).
 */
export const CHAT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b"