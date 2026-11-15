// Shared settings. Model names come from environment variables so they can be
// changed without editing code (Google retires models regularly).

// Must match vector(768) in supabase/schema.sql. If you change it, change both.
export const EMBED_DIMENSIONS = 768

export const embedModel = (): string =>
  process.env.GEMINI_EMBED_MODEL ?? 'gemini-embedding-2'

export const chatModel = (): string =>
  process.env.GEMINI_CHAT_MODEL ?? 'gemini-3.1-flash-lite'

export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}
