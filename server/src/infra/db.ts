import pg from 'pg'
import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

// Raw pg pool (keep it if anything still uses query/pool)
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon/Supabase ke liye zaroori
})
export const query = (text: string, params?: any[]) => pool.query(text, params)

// Prisma client — used by Phase 2 notebooks service
export const prisma = new PrismaClient()