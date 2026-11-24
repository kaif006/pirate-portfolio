import type { ServerResponse } from 'node:http'
import type { VercelRequest } from '@vercel/node'
import { Resend } from 'resend'
import { requireEnv } from './_lib/config.js'
import { allowRequest, clientKey } from './_lib/rateLimit.js'
import { contactSchema } from './_lib/validate.js'

type ContactRequest = Pick<VercelRequest, 'method' | 'headers' | 'socket'> & { body?: unknown }

export default async function handler(req: ContactRequest, res: ServerResponse) {
  function json(status: number, body: object) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(body))
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return json(405, { ok: false, error: 'Method not allowed' })
  }

  // 1. Validate on the server (never trust the frontend).
  const parsed = contactSchema.safeParse(req.body)
  if (!parsed.success) {
    return json(400, {
      ok: false,
      error: 'Please check the form fields.',
      fields: parsed.error.issues.map((issue) => ({
        field: String(issue.path[0] ?? ''),
        message: issue.message,
      })),
    })
  }
  const { name, email, subject, message, website } = parsed.data

  // 2. Honeypot: bots fill the hidden field. Pretend success, send nothing.
  if (website && website.length > 0) {
    return json(200, { ok: true })
  }

  try {
    const resend = new Resend(requireEnv('RESEND_API_KEY'))
    const recipient = requireEnv('CONTACT_TO_EMAIL')
    const allowed = await allowRequest(clientKey(req, 'contact'), 3, 3600)
    if (!allowed) {
      return json(429, { ok: false, error: 'Too many messages. Please try again later.' })
    }

    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL?.trim() || 'Portfolio <onboarding@resend.dev>',
      to: [recipient],
      replyTo: email,
      subject: `[Portfolio] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    })
    if (error) {
      console.error('Resend rejected contact mail:', error.name, error.statusCode)
      return json(503, { ok: false, error: 'Email delivery is unavailable. Please email me directly.' })
    }
    return json(200, { ok: true })
  } catch (err) {
    console.error('Contact handler error:', err)
    return json(503, { ok: false, error: 'The contact form is unavailable. Please email me directly.' })
  }
}
