import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import contact from './api/contact.js'

function localContact(): Plugin {
  return {
    name: 'local-contact',
    apply: 'serve',
    configureServer(server) {
      if (process.env.VERCEL === '1') return
      const keys = ['RESEND_API_KEY', 'CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'IP_HASH_SALT']
      const env = loadEnv(server.config.mode, server.config.root, keys)
      for (const key of keys) {
        if (env[key]) process.env[key] ??= env[key]
      }

      server.middlewares.use('/api/contact', async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/') return next()
        let body: unknown
        if (req.method === 'POST') {
          try {
            const chunks: Buffer[] = []
            let size = 0
            for await (const chunk of req.iterator({ destroyOnReturn: false })) {
              size += chunk.length
              if (size > 16 * 1024) {
                res.statusCode = 413
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: false, error: 'The message is too large.' }))
                req.resume()
                return
              }
              chunks.push(chunk)
            }
            body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          } catch {
            // Let the shared validation return the same response as production.
          }
        }
        await contact(Object.assign(req, { body }), res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localContact()],
  server: {
    proxy: {
      '/api/portfolio-chat': 'http://127.0.0.1:8000',
    },
  },
})
