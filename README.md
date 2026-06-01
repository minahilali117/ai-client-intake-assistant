# AI-Powered Client Intake & Proposal Assistant

Internal tool for managing client/project inquiries and generating proposal-style project briefs. Built with Next.js 15, NestJS, PostgreSQL, Prisma, and Docker.

## Phase 1 (current)

- Monorepo with Next.js frontend and NestJS API
- PostgreSQL + Prisma (`User`, `UserRole`)
- JWT access + refresh tokens (bcrypt-hashed refresh tokens in DB)
- Auth.js (NextAuth v5) on the frontend with httpOnly session cookies
- RBAC foundation: `ADMIN`, `SALES`, `DEVELOPER`
- Swagger at `/api/docs`
- Docker Compose for local/production-style runs
- Seed users for all three roles

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
cp ../.env .env   # or symlink DATABASE_URL and secrets
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

API: `http://localhost:3001`  
Swagger: `http://localhost:3001/api/docs`

### 4. Frontend

```bash
cd frontend
npm run dev
```

App: `http://localhost:3000`

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

## Roles & permissions (Phase 1)

| Endpoint        | ADMIN | SALES | DEVELOPER |
| --------------- | ----- | ----- | --------- |
| `GET /users/me` | ✓     | ✓     | ✓         |
| `GET /users`    | ✓     | —     | —         |
| `GET /users/:id`| ✓     | —     | —         |
| Auth routes     | ✓     | ✓     | ✓         |

Lead/inquiry/proposal permissions are added in Phase 2+.

## API endpoints (Phase 1)

| Method | Path            | Auth     | Description              |
| ------ | --------------- | -------- | ------------------------ |
| GET    | `/health`       | Public   | Health check             |
| POST   | `/auth/signup`  | Public   | Register (SALES role)    |
| POST   | `/auth/login`   | Public   | Login                    |
| POST   | `/auth/refresh` | Refresh  | Rotate tokens            |
| POST   | `/auth/logout`  | Bearer   | Invalidate refresh token |
| GET    | `/users/me`     | Bearer   | Current user profile     |
| GET    | `/users`        | ADMIN    | List users               |
| GET    | `/users/:id`    | ADMIN    | Get user by id           |

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
