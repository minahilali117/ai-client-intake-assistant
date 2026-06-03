# AI-Powered Client Intake & Proposal Assistant

Production-style internal CRM for client intake, project inquiries, AI-assisted proposal briefs, and sales pipeline tracking.

## Architecture

```text
┌─────────────┐     HTTPS      ┌──────────────────┐
│  Next.js 15 │ ◄────────────► │  Auth.js (v5)    │
│  App Router │                │  Session cookies │
└──────┬──────┘                └────────┬─────────┘
       │ REST + Bearer JWT               │
       ▼                                 │
┌──────────────────────────────────────┴───────┐
│  NestJS API                                   │
│  • JWT auth + refresh rotation                │
│  • RBAC guards                                │
│  • Request ID + structured logs               │
│  • OpenTelemetry (optional)                   │
│  • Swagger /api/docs                          │
└──────┬────────────────────────────────────────┘
       │ Prisma ORM
       ▼
┌──────────────┐     ┌────────────┐
│ PostgreSQL   │     │ uploads/   │  (file attachments)
└──────────────┘     └────────────┘
```

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | Next.js 15, Auth.js v5, Tailwind CSS |
| Backend | NestJS 10, Prisma 6, Passport JWT |
| Database | PostgreSQL 16 |
| AI | OpenAI (optional) + mock fallback |
| PDF | PDFKit |
| Observability | Request IDs, JSON logs, OTEL (optional) |
| CI | GitHub Actions |

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (recommended for PostgreSQL)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
```

Align `DATABASE_URL` in `backend/.env` with your Postgres credentials.

### 3. Database

```bash
docker compose up postgres -d
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### 4. Run services

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

| Service | URL |
| ------- | --- |
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |

## Docker

```bash
cp .env.example .env
docker compose up --build
```

## Environment variables

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_ACCESS_EXPIRES_IN` | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Default `7d` |
| `FRONTEND_URL` | CORS origin |
| `OPENAI_API_KEY` | Optional — enables OpenAI proposal generation |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `OTEL_ENABLED` | Set `true` to enable OpenTelemetry |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP trace endpoint |
| `NEXTAUTH_SECRET` / `AUTH_SECRET` | Auth.js encryption (frontend `.env.local`) |
| `INTERNAL_API_URL` | Backend URL used by the frontend container/server |
| `NEXT_PUBLIC_API_URL` | Public API URL for browser |

## Seed credentials

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | admin@example.com | Admin123! |
| Sales | sales@example.com | Sales123! |
| Developer | developer@example.com | Developer123! |

## Authentication flow

1. **Login** — `POST /auth/login` returns `accessToken` + `refreshToken` (refresh also in httpOnly cookie).
2. **API calls** — `Authorization: Bearer <accessToken>`.
3. **Refresh rotation** — `POST /auth/refresh` validates token version (`rtv` claim). Reuse of an old refresh token revokes all sessions.
4. **Logout** — `POST /auth/logout` clears refresh hash and increments token version.
5. **Frontend** — Auth.js Credentials provider; tokens in encrypted session cookie (not `localStorage`).

## Roles & permissions

| Capability | ADMIN | SALES | DEVELOPER |
| -------- | ----- | ----- | --------- |
| Users admin | ✓ | — | — |
| Leads CRUD | ✓ | ✓ | View qualified only |
| Inquiries CRUD | ✓ | ✓ | Notes only |
| Proposals | ✓ | ✓ | Read (qualified+) |
| File uploads | ✓ | ✓ | — |
| Dashboard | ✓ | ✓ | ✓ (scoped metrics) |

## API endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | Health check |
| POST | `/auth/signup` | Register (SALES) |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Rotate tokens |
| POST | `/auth/logout` | Logout |
| GET | `/users/me` | Profile |
| GET/POST/PATCH/DELETE | `/leads` | Lead management |
| GET/POST/PATCH/DELETE | `/inquiries` | Inquiry management |
| PATCH | `/inquiries/:id/technical-notes` | Developer notes |
| POST | `/proposals/generate` | AI proposal generation |
| GET/PATCH | `/proposals/:id` | View/edit proposal |
| GET | `/proposals/:id/export` | PDF export |
| GET | `/proposals/by-inquiry/:inquiryId` | Proposal by inquiry |
| POST | `/files/upload` | Upload attachment |
| GET | `/files/inquiry/:inquiryId` | List attachments |
| GET | `/files/:id/download` | Download file |
| GET | `/dashboard/summary` | Analytics |
| GET | `/activity` | Recent activity |

Full interactive docs: **http://localhost:3001/api/docs**

## AI configuration

Without `OPENAI_API_KEY`, proposals use the **mock generator** (deterministic, offline-safe).

With `OPENAI_API_KEY`, the API uses OpenAI chat completions with JSON output and falls back to mock on errors.

## Soft deletes

Leads, inquiries, and proposals use `deletedAt` — records are hidden from queries but retained for audit/recovery.

## Audit trail

`activity_logs` stores:

- **actor** — user relation
- **action** — enum (lead created, status changed, proposal generated, file uploaded, etc.)
- **entity** — `entityType` + `entityId`
- **metadata** — JSON with `oldValue`, `newValue`, `field`, `changes`

## Observability

- **Request ID** — `X-Request-Id` on every request/response
- **Structured logs** — JSON lines with method, path, status, duration, userId
- **OpenTelemetry** — set `OTEL_ENABLED=true` and optional OTLP endpoint

## Testing

```bash
cd backend
npm run test          # unit tests
npm run test:e2e      # integration (requires DB)

cd frontend
npm run test          # label/util tests
```

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):

- Install → Prisma migrate → seed → build → test (backend + frontend)

## Postman

Import `postman/Client-Intake-API.postman_collection.json`. Run **Auth → Login** to set `accessToken`.

## Tradeoffs

| Decision | Rationale |
| -------- | --------- |
| Auth.js + JWT API | Framework-native sessions; API stays stateless for mobile/integrations |
| Mock AI fallback | Feature works offline; no key required for demos/CI |
| Local file storage | Simple for internal tool; S3 would be next step for scale |
| Refresh version counter | Lightweight rotation without token families table |
| Server Components default | Per AGENT.md — minimal client JS |

## Future improvements

- S3/object storage for attachments
- Email-ready proposal delivery
- WebSocket activity feed
- Admin user management UI
- E2E tests with Playwright
- Rate limiting per user
- Horizontal scaling with Redis sessions

## License

Private / evaluation project.
