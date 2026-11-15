import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import { EMBED_DIMENSIONS, embedModel, requireEnv } from './config.js'

// Clients are created on demand so environment variables are read at call time
// (this lets scripts/ingest.ts load .env.local before anything runs).
export function supabase() {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
}

export function gemini() {
  return new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') })
}

// One text in, one vector out. We embed one text per call on purpose: some
// multimodal embedding models merge several inputs into a single vector.
export async function embedText(text: string): Promise<number[]> {
  const res = await gemini().models.embedContent({
    model: embedModel(),
    contents: text,
    config: { outputDimensionality: EMBED_DIMENSIONS },
  })
  const values = res.embeddings?.[0]?.values
  if (!values || values.length === 0) throw new Error('No embedding returned')
  return values
}
