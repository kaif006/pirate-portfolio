// Reads data/knowledge/*.md, splits it into chunks, embeds each chunk with
// Gemini, and loads the result into Supabase.
//
// Run:  npm run ingest      (re-run any time the documents change)

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { config } from 'dotenv'
import { embedText, supabase } from '../api/_lib/clients.js'

config({ path: '.env.local' })

const KNOWLEDGE_DIR = path.join(process.cwd(), 'data', 'knowledge')
const MAX_CHUNK_CHARS = 1200

type Chunk = { source: string; heading: string; content: string }

// Split on "## " headings, then split long sections by paragraph.
function chunkMarkdown(source: string, text: string): Chunk[] {
  const parts = text.split(/^## /m)
  const title = (parts[0].split('\n')[0] ?? '').replace(/^#\s*/, '').trim() || source
  const chunks: Chunk[] = []

  const addSection = (heading: string, body: string) => {
    const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    let current = ''
    const flush = () => {
      if (current.trim()) {
        chunks.push({ source, heading, content: `${title} - ${heading}\n${current.trim()}` })
      }
      current = ''
    }
    for (const p of paragraphs) {
      if (current && current.length + p.length > MAX_CHUNK_CHARS) flush()
      current += (current ? '\n\n' : '') + p
    }
    flush()
  }

  // Text before the first "##" (after the title line) is the overview.
  const intro = parts[0].split('\n').slice(1).join('\n').trim()
  if (intro) addSection('Overview', intro)

  for (const section of parts.slice(1)) {
    const [headingLine, ...rest] = section.split('\n')
    addSection(headingLine.trim(), rest.join('\n'))
  }
  return chunks
}

async function main() {
  const files = (await readdir(KNOWLEDGE_DIR)).filter(
    (f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md',
  )
  if (files.length === 0) throw new Error(`No .md files found in ${KNOWLEDGE_DIR}`)

  const chunks: Chunk[] = []
  for (const file of files) {
    const text = await readFile(path.join(KNOWLEDGE_DIR, file), 'utf8')
    chunks.push(...chunkMarkdown(file, text))
  }
  console.log(`Found ${files.length} files, ${chunks.length} chunks.`)

  // Embed everything first, so a failure never leaves the table half-empty.
  const rows: (Chunk & { embedding: number[] })[] = []
  for (const [i, chunk] of chunks.entries()) {
    rows.push({ ...chunk, embedding: await embedText(chunk.content) })
    console.log(`Embedded ${i + 1}/${chunks.length}: ${chunk.source} / ${chunk.heading}`)
    await new Promise((r) => setTimeout(r, 250)) // stay gentle on the free tier
  }

  const db = supabase()
  const { error: deleteError } = await db.from('documents').delete().neq('id', 0)
  if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`)

  for (let i = 0; i < rows.length; i += 20) {
    const { error } = await db.from('documents').insert(rows.slice(i, i + 20))
    if (error) throw new Error(`Insert failed: ${error.message}`)
  }
  console.log(`Done. Stored ${rows.length} chunks.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
