# Kaif's Ukiyo-e Voyage: Interactive 3D Web Portfolio

A 3D portfolio where a low-poly ship sails across an Ukiyo-e styled sea, stopping at five project islands. Includes a custom Blender avatar, a promotional video, a RAG-based chatbot, and an email contact system.

**Live site:** <!-- TODO: paste your Vercel URL -->
**Repository:** <!-- TODO: paste your GitHub URL -->

## Features

- Scroll-driven 3D scene (React Three Fiber) with a custom Ukiyo-e water shader
- Five themed project islands with overlay details and looping clips
- About, Skills, Education and Contact panels
- Chatbot with a custom low-poly avatar, answering from Kaif's CV and project documents (RAG)
- Contact form that sends email through Resend, with a message-in-a-bottle animation
- Responsive layout with a simplified 3D scene on mobile

## Tech stack

| Area | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, React Three Fiber, drei |
| 3D assets | Blender (GLB export) |
| Video | Adobe After Effects (MP4) |
| Backend | Vercel serverless functions (`/api`) |
| AI | Google Gemini (embeddings and answers) |
| Vector database | Supabase Postgres with pgvector |
| Email | Resend |
| Hosting | Vercel |

## How the RAG chatbot works

1. **Collect:** documents about Kaif live in `data/knowledge/` (CV, skills, education, projects).
2. **Chunk:** `scripts/ingest.ts` splits each document by heading, and long sections by paragraph (about 1,200 characters max).
3. **Embed:** each chunk is converted to a 768-dimension vector with the Gemini embedding model.
4. **Store:** vectors are saved in the `documents` table in Supabase (pgvector) with a cosine-similarity index.
5. **Retrieve:** when a visitor asks a question, `/api/chat` embeds the question and finds the 5 most similar chunks (`match_documents`).
6. **Generate:** the retrieved chunks and the question go to a Gemini chat model with strict instructions to answer only from the context.
7. **Stay honest:** if no chunk is similar enough, or the model reports the context lacks the answer, the bot says it does not have that information and offers the contact form. It does not invent facts.

## Setup and installation

Requirements: Node.js (LTS) and npm, plus free accounts at Google AI Studio, Supabase, Resend and Vercel.

```bash
git clone <!-- TODO: repo URL -->
cd <!-- TODO: folder name -->
npm install
cp .env.example .env.local   # then fill in the values
```

### Environment variables

| Name | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key |
| `GEMINI_EMBED_MODEL` | Embedding model (default `gemini-embedding-2`) |
| `GEMINI_CHAT_MODEL` | Chat model (default `gemini-3.1-flash-lite`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only, secret) |
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO_EMAIL` | Inbox that receives contact messages |
| `CONTACT_FROM_EMAIL` | Sender on a domain verified in Resend |
| `IP_HASH_SALT` | Random string used to hash visitor IPs |

### Database

1. Create a Supabase project.
2. Open SQL Editor, paste the contents of `supabase/schema.sql`, and run it.

### Load the chatbot knowledge

```bash
npm run ingest
```

Re-run this whenever you edit files in `data/knowledge/`.

### Run locally

```bash
npm run dev        # frontend and /api/contact using .env.local
npx vercel dev     # frontend plus the /api functions
```

The contact form requires an active Supabase project with `supabase/schema.sql`
applied and a Resend key with sending access. For local testing with
`onboarding@resend.dev`, set `CONTACT_TO_EMAIL` to the email on your Resend
account. For a different recipient, set `CONTACT_FROM_EMAIL` to a sender on a
verified domain. On Vercel, configure the same server-side variables and redeploy.

## Deployment

1. Push the repository to GitHub.
2. Import it in Vercel (framework preset: Vite).
3. Add the environment variables above in Project Settings.
4. Deploy. Every push to `main` redeploys automatically.

### Preview the Python portfolio assistant

The Vite project also exposes the Python assistant at `POST /api/portfolio-chat`.
It reads `data/knowledge/` and uses Gemini directly. The first question on a new
function instance builds an in-memory index that later requests can reuse.

1. Set `GEMINI_API_KEY` for the Preview environment in your Vercel project.
2. Push a branch with the deployment files to create a Preview.
3. Send a question to the Preview URL. If Deployment Protection is enabled,
   authenticate with Vercel before calling the route.

```bash
curl -fS https://YOUR-PREVIEW.vercel.app/api/portfolio-chat \
  -H 'Content-Type: application/json' \
  -d '{"question":"What projects has Kaif worked on?"}'
```

Expect JSON with an `answer` grounded in the portfolio Markdown. The route also
accepts `message` as an alias for `question`. To adopt it in the portfolio, point
the chat form at the same-origin `/api/portfolio-chat` path after verifying the
Preview. Apply rate limiting to the Python route before public use to protect
your Gemini quota.

For local testing from the repo root, put `GEMINI_API_KEY` in `.env`, install
`requirements.txt` in your virtual environment, and run:

```bash
python -m uvicorn portfolio_chat.api:app --port 8000
```

## Project structure

```
api/            Vercel serverless functions (chat, contact) and shared helpers
portfolio_chat/ Python assistant and Markdown retrieval
data/knowledge/ Documents used by the chatbot
public/         Exported models (GLB), clips and promo video, audio
scripts/        ingest.ts (build the vector index)
src/            React app, 3D scene, overlays, project data
supabase/       schema.sql
docs/           Report draft, screenshots, email delivery evidence
```

## Security notes

- API keys live only in environment variables; `.env.local` is git-ignored.
- Contact form is validated on the frontend and again on the server.
- Spam protection: hidden honeypot field plus server-side rate limiting.
- Emails are sent as plain text, so visitor input is never rendered as HTML.

## Assets and credits

- Blender source files and the After Effects project are submitted separately in a source archive. Only exported GLB and MP4 files are in this repository.
- Music and sound effects: <!-- TODO: list each track, author, and license -->
- Fonts and textures: <!-- TODO -->

## Author

Kaif, BS Computer Science, NED University of Engineering & Technology
GitHub: github.com/kaif006
