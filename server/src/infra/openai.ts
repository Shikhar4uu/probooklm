// server/src/infra/openai.ts
import OpenAI from 'openai'

// OpenAI — used for EMBEDDINGS (text-embedding-3-small, 1536-dim)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// NVIDIA (OpenAI-compatible) — used for CHAT
export const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
})