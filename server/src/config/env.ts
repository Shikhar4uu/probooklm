import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  PORT: z.coerce.number().default(8080),
})

export const env = schema.parse(process.env)