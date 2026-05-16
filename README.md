# Peblo Notes Workspace

A full-stack, AI-powered notes workspace built for the Peblo Full Stack Developer Challenge. The app covers the required product loop end to end: secure authentication, note creation and autosave, tag/category organization, archive management, search and filtering, AI summaries/action items/title suggestions, public note sharing, and productivity analytics.

## What Stands Out

- **Modern workspace UX**: responsive dark interface with a focused note editor, side AI panel, archive mode, category/tag controls, and share-ready public pages.
- **Meaningful AI workflow**: Google Gemini generates a summary, action items, and a suggested title from note content. Suggested titles can be applied directly to the note.
- **Power-user polish**: debounced autosave, `Ctrl / Command + S`, markdown preview, responsive filters, archive/restore flow, and copy-to-clipboard share links.
- **Full-stack cohesion**: Next.js 16 App Router pages and Route Handlers share one typed Prisma data model.
- **Hiring-ready docs**: setup instructions, architecture notes, API map, and sample outputs are included.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 App Router, React 19, SWR, Lucide icons |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL with Prisma ORM |
| Authentication | JWT in an HTTP-only cookie, bcrypt password hashing |
| AI | Google Gemini via `@google/generative-ai` |
| Styling | CSS custom properties plus scoped JSX styles |

## Core Features

- Signup, login, logout, protected dashboard routes, persistent sessions.
- Create, edit, autosave, archive, restore, and delete notes.
- Organize notes by tags and categories.
- Search notes by title/content/category/tag, filter by tag/category, sort by latest update.
- Generate AI summary, action items, and suggested title.
- Share public notes without login through secure UUID links.
- View productivity insights: active notes, archived notes, recent notes, most-used tags, AI usage, and weekly activity.
- Preview markdown for headings, lists, tasks, quotes, and bold text.

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env` in the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
JWT_SECRET="replace-with-a-long-random-secret"
LLM_API_KEY="your-google-gemini-api-key"
```

Use `.env.example` as the template. Never commit real credentials.

### 3. Prepare Database

```bash
npx prisma db push
```

Optional Prisma Studio:

```bash
npx prisma studio
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Verify

```bash
npm run lint
npm run build
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register and start a session |
| `POST` | `/api/auth/login` | Login and set session cookie |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Return current user |
| `GET` | `/api/notes?q=&tag=&category=&archived=` | List notes with discovery filters |
| `POST` | `/api/notes` | Create note |
| `GET` | `/api/notes/:id` | Get one owned note |
| `PATCH` | `/api/notes/:id` | Autosave note fields, tags, category, archive state |
| `DELETE` | `/api/notes/:id` | Delete note |
| `POST` | `/api/notes/:id/generate-summary` | Generate AI summary/actions/title |
| `POST` | `/api/notes/:id/share` | Create or reuse public share link |
| `GET` | `/api/shared/:shareId` | Read public note without auth |
| `GET` | `/api/insights` | Productivity metrics |

## Architecture Notes

- `proxy.ts` protects dashboard and API routes using the Next.js 16 proxy convention.
- Route Handlers use `cookies()` asynchronously, matching current Next.js APIs.
- Tags are normalized to lowercase and deduplicated before writes.
- Insights are scoped to the authenticated user so tag counts and AI usage do not leak across accounts.
- Notes are public only when `isPublic` is true and a valid `shareId` exists.

## Demo Video Checklist

Record a 5-10 minute walkthrough covering:

1. Signup/login and protected route redirect.
2. Create a note, write content, observe autosave.
3. Add category and tags, then search/filter from the workspace.
4. Generate AI summary/action items/suggested title and apply the title.
5. Toggle markdown preview.
6. Archive and restore a note.
7. Create a public share link and open it without login.
8. Show the insights dashboard.

## Sample Outputs

See [docs/sample-outputs.md](docs/sample-outputs.md) for example API responses, AI output, and a schema summary suitable for the Peblo submission package.
