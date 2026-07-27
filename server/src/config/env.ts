import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(20),   // ← fails loudly if empty/short
  CLIENT_URL: z.string().default('http://localhost:5173'),
  PORT: z.string().default('3000'),
})

export const env = schema.parse(process.env)