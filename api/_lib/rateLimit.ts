import { createHash } from 'node:crypto'
import type { VercelRequest } from '@vercel/node'
import { supabase } from './clients.js'

// Builds a rate-limit key from the visitor's IP. The IP is hashed with a salt
// so no raw IP addresses are stored.
export function clientKey(req: VercelRequest, scope: string): string {
  const forwarded = req.headers['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const ip = first?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  const salt = process.env.IP_HASH_SALT ?? 'dev-salt-change-me'
  const hash = createHash('sha256').update(salt + ip).digest('hex').slice(0, 32)
  return `${scope}:${hash}`
}

// Returns true if the request is allowed. Uses the check_rate_limit() function
// defined in supabase/schema.sql. If the check itself fails, we deny (fail closed).
export async function allowRequest(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabase().rpc('check_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error('Rate limit check failed:', error.message)
    return false
  }
  return data === true
}
