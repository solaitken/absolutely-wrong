# Absolutely Wrong

> A chat app where an AI **always** disagrees with you — confidently, condescendingly, and very, very wrong.

A parody of Claude's "you're absolutely right" sycophancy. Say anything. The bot will find a way to tell you the opposite.

**[absolutely-wrong.techmeat.dev](https://absolutely-wrong.techmeat.dev)**

---

## How it works

1. You type a statement.
2. GLM-5.1 (via [Z.ai](https://api.z.ai)) reads it and constructs the most pedantic, arrogant counter-argument possible.
3. The bot responds in the same language you wrote in.
4. Conversation history persists for 7 days (SQLite, session cookie).

No accounts. No tracking. No "you're absolutely right."

## Tech stack

| Layer | Choice |
|---|---|
| **Backend** | Hono.js 4.x + TypeScript, Node.js ≥22 |
| **Frontend** | React 19 + Vite 8, mobile-first SPA |
| **Database** | SQLite (better-sqlite3, WAL mode) |
| **LLM** | GLM-5.1 via api.z.ai |
| **Deploy** | GitHub Actions → VPS (systemd + Caddy) |

## Local development

### Prerequisites

- Node.js ≥22
- npm ≥10
- A [Z.ai](https://open.bigmodel.cn) API key

### Setup

```bash
# Clone
git clone https://github.com/solaitken/absolutely-wrong.git
cd absolutely-wrong

# Backend
cd backend
cp .env.example .env   # then add your GLM_API_KEY
npm ci
npx tsc               # compile TypeScript
npm start             # starts on port 30000

# Frontend (separate terminal)
cd frontend
npm ci
npm run dev           # Vite dev server on port 5173
```

Open `http://localhost:5173` — the dev server proxies `/api` to the backend.

### Running tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## Project structure

```
backend/          Hono.js API server
  src/
    index.ts      Routes and middleware
    db.ts         SQLite schema and queries
    llm/          LLM provider abstraction
      types.ts    LlmProvider interface
      glm.ts      GLM-5.1 implementation
  data/           SQLite database (gitignored)

frontend/         React SPA
  src/
    App.tsx       Root component
    api.ts        API client (fetch wrapper)
    components/   UI components
    types.ts      Shared types
  public/         Static assets (fonts, avatar)

docs/             Design documents
  about.md        Product vision
  specs.md        Requirements
  architecture.md System design
  plan.md         Phased roadmap
```

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/chat` | Get session history |
| `POST` | `/api/chat` | Send message → bot reply |
| `DELETE` | `/api/chat` | Clear session |

Rate limit: 20 requests/minute per IP.

## License

MIT
