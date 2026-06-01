# AI-Powered Client Intake & Proposal Assistant

Internal tool for managing client/project inquiries and generating proposal-style project briefs. Built with Next.js 15, NestJS, PostgreSQL, Prisma, and Docker.

## Phase 1

- Authentication (JWT + Auth.js), RBAC foundation, Docker, Swagger

## Phase 2

- Leads, inquiries, activity logging, CRM UI

## Phase 3 (current)

- AI proposal generation (OpenAI or mock fallback)
- Proposal view/edit/save workflow
- Dashboard analytics (cards, charts, recent activity)

## Tech stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Frontend     | Next.js 15 App Router, Auth.js v5   |
| Backend      | NestJS 10, Prisma 6                 |
| Database     | PostgreSQL 16                       |
| Auth         | JWT + bcrypt, NextAuth Credentials  |
| Containers   | Docker Compose                      |

## Architecture

```text
Browser → Next.js (Auth.js session, Server Components)
              ↓ REST + Bearer access token
         NestJS API (Guards, RBAC, DTOs)
              ↓ Prisma
         PostgreSQL
```

**Design choices (aligned with `AGENT.md`):**

- **Server Components by default** — dashboard and layouts fetch on the server; forms are small Client Components.
- **Auth.js for frontend identity** — avoids custom cookie/session code; tokens live in encrypted JWT session cookies, not `localStorage`.
- **NestJS enforces authorization** — `@Roles()` + `RolesGuard`; frontend role display is UX only.
- **Refresh tokens** — hashed in PostgreSQL; optional httpOnly `refreshToken` cookie from API for refresh flows.
- **Public signup** — new users always receive `SALES`; elevated roles come from seed/admin flows (Phase 2 user management).

## Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (optional but recommended)

## Setup (local development)

### 1. Clone and install

```bash
cp .env.example .env
# Edit .env — set JWT_* and NEXTAUTH_SECRET to long random strings (32+ chars)

npm install
```

### 2. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 3. Backend

```bash
cd backend
# backend/.env must exist (copy from repo root .env or backend/.env.example)
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

The API must be running on port **3001** before you log in from the frontend.

API: `http://localhost:3001`  
Swagger: `http://localhost:3001/api/docs`

### 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # required: AUTH_SECRET / NEXTAUTH_SECRET
npm run dev
```

App: `http://localhost:3000`

> Auth.js requires `AUTH_SECRET` or `NEXTAUTH_SECRET` in **`frontend/.env.local`** (not only the repo root `.env`).

## Docker (full stack)

```bash
cp .env.example .env
# Set JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, NEXTAUTH_SECRET

docker compose up --build
```

| Service    | URL                          |
| ---------- | ---------------------------- |
| Frontend   | http://localhost:3000        |
| Backend    | http://localhost:3001        |
| Swagger    | http://localhost:3001/api/docs |
| PostgreSQL | localhost:5432               |

## Environment variables

| Variable               | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `DATABASE_URL`         | PostgreSQL connection string                     |
| `JWT_ACCESS_SECRET`    | Access token signing secret                      |
| `JWT_REFRESH_SECRET`   | Refresh token signing secret                     |
| `JWT_ACCESS_EXPIRES_IN`| Default `15m`                                    |
| `JWT_REFRESH_EXPIRES_IN`| Default `7d`                                    |
| `PORT`                 | API port (default `3001`)                        |
| `FRONTEND_URL`         | CORS origin (default `http://localhost:3000`)    |
| `NEXTAUTH_URL`         | Frontend URL for Auth.js                         |
| `NEXTAUTH_SECRET`      | Auth.js encryption secret (`AUTH_SECRET` alias)  |
| `NEXT_PUBLIC_API_URL`  | Public API base URL for browser/server fetch     |

## Database

```bash
cd backend
npx prisma migrate dev      # development
npx prisma migrate deploy   # production / Docker
npx prisma db seed          # seed users
npx prisma studio           # optional GUI
```

## Seed credentials

| Role      | Email                 | Password       |
| --------- | --------------------- | -------------- |
| Admin     | admin@example.com     | Admin123!      |
| Sales     | sales@example.com     | Sales123!      |
| Developer | developer@example.com | Developer123!  |

## Authentication flow

1. **Signup** — `POST /auth/signup` creates a `SALES` user; frontend signs in via Auth.js Credentials.
2. **Login** — Credentials provider calls `POST /auth/login`; API returns access + refresh tokens.
3. **Session** — Auth.js stores tokens in an encrypted JWT session cookie (httpOnly, not `localStorage`).
4. **API calls** — Server Components use `auth()` and send `Authorization: Bearer <accessToken>`.
5. **Refresh** — Before access token expiry, Auth.js calls `POST /auth/refresh` with the refresh token.
6. **Logout** — `POST /auth/logout` clears refresh hash; Auth.js `signOut` clears the session.

## Roles & permissions

| Capability | ADMIN | SALES | DEVELOPER |
| ---------- | ----- | ----- | --------- |
| Manage leads | ✓ | ✓ | — |
| View leads | ✓ | ✓ | Qualified only |
| Manage inquiries | ✓ | ✓ | — |
| View inquiries | ✓ | ✓ | Qualified leads only |
| Technical notes | ✓ | ✓ | ✓ (dedicated endpoint) |
| Manage users | ✓ | — | — |

## API endpoints

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| GET | `/health` | Public | Health check |
| POST | `/auth/signup` | Public | Register (SALES) |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/refresh` | Refresh | Rotate tokens |
| POST | `/auth/logout` | Bearer | Logout |
| GET | `/users/me` | Bearer | Profile |
| GET | `/users` | ADMIN | List users |
| GET | `/leads` | Bearer | List leads (paginated) |
| POST | `/leads` | ADMIN, SALES | Create lead |
| GET | `/leads/:id` | Bearer | Lead detail + inquiries |
| PATCH | `/leads/:id` | ADMIN, SALES | Update lead |
| DELETE | `/leads/:id` | ADMIN, SALES | Soft delete |
| GET | `/inquiries` | Bearer | List inquiries |
| POST | `/inquiries` | ADMIN, SALES | Create inquiry |
| GET | `/inquiries/:id` | Bearer | Inquiry detail |
| PATCH | `/inquiries/:id` | ADMIN, SALES | Update inquiry |
| PATCH | `/inquiries/:id/technical-notes` | Bearer | Technical notes |
| DELETE | `/inquiries/:id` | ADMIN, SALES | Soft delete |
| GET | `/activity` | Bearer | Recent activity |
| GET | `/activity/:type/:id` | Bearer | Entity activity |
| POST | `/proposals/generate` | ADMIN, SALES | Generate proposal from inquiry |
| GET | `/proposals/:id` | Bearer | View proposal |
| GET | `/proposals/by-inquiry/:inquiryId` | Bearer | Proposal for inquiry |
| PATCH | `/proposals/:id` | ADMIN, SALES | Edit proposal |
| GET | `/dashboard/summary` | Bearer | Dashboard metrics & activity |

## AI configuration

Set `OPENAI_API_KEY` in backend `.env` to enable OpenAI proposal generation. Without it, the **mock generator** runs automatically so the feature always works locally.

## Assumptions & tradeoffs

- **Monorepo npm workspaces** — simple sharing; no shared package yet to keep Phase 1 small.
- **Signup defaults to SALES** — prevents privilege escalation via public registration.
- **JWT in Auth.js session** — access token is in the encrypted session cookie for server-side API calls; refresh token is also in the JWT payload (encrypted by Auth.js), not in `localStorage`.
- **Rate limiting** — Throttler on auth routes; global limit on other routes.
- **Phase 2+** — leads, inquiries, proposals, dashboard metrics, AI generator, activity logs.

## Project structure

```text
├── backend/          # NestJS API
│   ├── prisma/
│   └── src/
├── frontend/         # Next.js 15
│   └── src/app/
│       ├── (auth)/
│       └── (protected)/dashboard/
├── docker-compose.yml
└── AGENT.md          # Engineering standards
```

## License

Private / evaluation project.
