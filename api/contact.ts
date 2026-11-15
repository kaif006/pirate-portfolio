import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import { requireEnv } from './_lib/config.js'
import { allowRequest, clientKey } from './_lib/rateLimit.js'
import { contactSchema } from './_lib/validate.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  // 1. Validate on the server (never trust the frontend).
  const parsed = contactSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
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
    return res.status(200).json({ ok: true })
  }

  // 3. Rate limit: 3 messages per hour per visitor.
  const allowed = await allowRequest(clientKey(req, 'contact'), 3, 3600)
  if (!allowed) {
    return res.status(429).json({
      ok: false,
      error: 'Too many messages. Please try again later.',
    })
  }

  // 4. Send. Plain text only, so visitor input is never rendered as HTML.
  try {
    const resend = new Resend(requireEnv('RESEND_API_KEY'))
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL ?? 'Portfolio <onboarding@resend.dev>',
      to: [requireEnv('CONTACT_TO_EMAIL')],
      replyTo: email,
      subject: `[Portfolio] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    })
    if (error) {
      console.error('Resend error:', error)
      return res.status(500).json({ ok: false, error: 'Could not send your message.' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Contact handler error:', err)
    return res.status(500).json({ ok: false, error: 'Could not send your message.' })
  }
}
