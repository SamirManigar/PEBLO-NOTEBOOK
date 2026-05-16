# Peblo Notes Workspace

A full-stack, AI-powered collaborative notes workspace built for the Peblo challenge.

## Features

- **Authentication**: JWT-based secure authentication.
- **Notes Workspace**: Rich notes with 1-second debounce auto-save.
- **Organization**: Tag-based filtering with a proper many-to-many relationship.
- **AI Integration**: Deep integration with Gemini 2.5 Flash Lite to generate summaries, action items, and title suggestions (Structured JSON output).
- **Public Sharing**: Stealth sharing via secure UUID links — accessible without login.
- **Dashboard Insights**: Live metrics for note counts, AI interactions, top tags, and weekly activity.
- **Premium UI**: Glassmorphism, smooth animations, and dark mode interface.

## Tech Stack

| Layer | Choice |
|---|---|
| **Frontend/Backend** | Next.js 14 App Router (React) |
| **Database** | PostgreSQL via Supabase + Prisma ORM |
| **Auth** | JWT + bcrypt (custom, HTTP-only cookie) |
| **AI** | Google Gemini 2.5 Flash Lite |
| **Styling** | Vanilla CSS with CSS custom properties |
| **Data Fetching** | SWR for live updates |

## Setup Instructions

### 1. Clone and Install Dependencies
```bash
git clone <your-repo>
cd peblo-notes
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key"
LLM_API_KEY="your-google-gemini-api-key"
```

#### Getting your Supabase connection string:
1. Go to [supabase.com](https://supabase.com) → Create a new project
2. In the dashboard go to **Settings → Database**
3. Copy the **Connection string** under "URI" (select **Transaction** mode for serverless)

#### Getting your Gemini API key:
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API key** → Create API key

### 3. Initialize the Database
Push the Prisma schema to your Supabase PostgreSQL instance:
```bash
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login and get JWT cookie |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/notes` | List notes (supports `?q=` and `?tag=`) |
| `POST` | `/api/notes` | Create a new note |
| `GET` | `/api/notes/:id` | Get a single note |
| `PATCH` | `/api/notes/:id` | Update note (auto-save) |
| `DELETE` | `/api/notes/:id` | Delete a note |
| `POST` | `/api/notes/:id/generate-summary` | Generate AI insights |
| `POST` | `/api/notes/:id/share` | Generate public share link |
| `GET` | `/api/shared/:shareId` | Get public note (no auth) |
| `GET` | `/api/insights` | Get productivity dashboard data |

## Architecture Decisions

1. **Monorepo (Next.js)**: Using Next.js Route Handlers eliminates a separate backend service — single `npm run dev` starts everything.
2. **Supabase PostgreSQL + Prisma**: Production-grade PostgreSQL database with a clean, typed ORM and proper many-to-many tag relationships for efficient filtering.
3. **Structured AI Prompts**: Gemini is called with `responseMimeType: 'application/json'` to guarantee a valid JSON response for summaries and action items — no manual parsing needed.
4. **Debounced Auto-save**: A 1000ms React `useEffect` debounce with a "Saving..." UI indicator ensures the backend isn't flooded while maintaining a responsive feel.
5. **Edge Middleware**: Uses `jose` (WASM-compatible JWT) in Next.js Middleware to protect all dashboard routes at the Edge, correctly excluding `/shared/*` for public access.
