# AGENT.md

This document defines engineering standards for this repository.

The goal is to produce maintainable, secure, scalable, performant, and production-ready software while following modern Next.js, NestJS, TypeScript, PostgreSQL, and cloud-native best practices.

---

# General Principles

- Prefer framework conventions over custom solutions.
- Favor simplicity over cleverness.
- Avoid overengineering.
- Optimize for maintainability.
- Keep code modular and testable.
- Follow existing architecture and naming conventions.
- Avoid duplication.
- Make performance-conscious decisions.
- Prioritize security by default.
- Prefer solutions that scale naturally with future growth.
- Every feature should provide real user value.

---

# Next.js Standards

## App Router First

Use the Next.js App Router.

Prefer framework-native features before introducing third-party libraries.

---

## Server Components by Default

Default to Server Components.

Only use Client Components when browser-side functionality is required.

Examples

- useState
- useEffect
- useRef
- event handlers
- browser APIs
- WebSockets
- animations
- forms
- drag-and-drop interactions

Minimize the Client Component tree whenever possible.

---

## Avoid use client in Route Files

Prefer route files (`page.tsx`) as Server Components.

Move interactive behavior into dedicated Client Components.

Preferred

```tsx
 appdashboardpage.tsx

import DashboardClient from @componentsdashboarddashboard-client;

export default async function Page() {
  const data = await getData();
  return DashboardClient data={data} ;
}
```

Avoid converting entire routes into Client Components unless absolutely necessary.

---

## Choosing Server vs Client Components

Default to Server Components.

Use Server Components for

- data fetching
- route composition
- static content
- authenticated server rendering
- SEO-sensitive content

Use Client Components for

- state management
- event handlers
- forms
- browser APIs
- WebSockets
- animations

Move interactivity into small Client Components rather than converting entire pages.

---

## Page vs Layout Responsibilities

### layout.tsx

Use layouts for

- navigation
- sidebars
- headers
- providers
- authentication wrappers
- shared UI

Layouts should persist across route navigation.

### page.tsx

Pages should

- define route entry points
- fetch data when appropriate
- compose components

Pages should remain thin.

Avoid large page files containing significant business logic.

---

## Route Groups

Use route groups for organization.

Examples

```text
(public)
(auth)
(protected)
(marketing)
(admin)
```

Route groups should organize code without affecting URLs.

---

## Data Fetching

Prefer server-side data fetching.

Use

```tsx
await fetch(...)
```

inside Server Components whenever possible.

Only fetch on the client when

- real-time updates are required
- browser state is involved
- user interaction drives requests

Avoid unnecessary client-side fetching.

---

## Rendering Strategy

Understand and intentionally choose between

- Static Rendering
- Dynamic Rendering
- Server-Side Rendering (SSR)
- Client-Side Rendering (CSR)

Prefer SSR or Server Components whenever practical.

Do not default to CSR.

Choose rendering strategies deliberately.

---

## Caching & Revalidation

Understand and intentionally control

- fetch caching
- route caching
- revalidation
- dynamic rendering

Avoid disabling caching without justification.

Prefer framework-native caching mechanisms.

---

## Loading States

Implement route-level loading states.

Use

```text
loading.tsx
```

Requirements

- Avoid blank screens
- Prefer skeletons over spinners when practical
- Prevent layout shifts

---

## Error Boundaries

Implement route-level error boundaries.

Use

```text
error.tsx
```

Requirements

- User-friendly messages
- Retry actions
- Graceful recovery
- No stack traces exposed
- Error logging in development

Prefer scoped boundaries when appropriate.

Examples

```text
apperror.tsx
appdashboarderror.tsx
appsettingserror.tsx
```

---

## Not Found Handling

Implement

```text
not-found.tsx
```

Requirements

- Clear explanation
- Recovery actions
- Consistent design

Avoid generic browser 404 pages.

---

## Metadata & SEO

Use the Metadata API.

Prefer

```tsx
export const metadata = {}
```

over manual head management.

Provide

- title
- description
- open graph metadata where appropriate

---

## Assets

Use

```tsx
nextimage
```

for images.

Use

```tsx
nextfont
```

for fonts.

Avoid unoptimized assets.

---

# Authentication Standards

## Prefer NextAuth (Auth.js)

Use NextAuthAuth.js as the default authentication solution.

Avoid building custom authentication systems unless requirements explicitly demand it.

Leverage

- sessions
- middleware
- providers
- secure cookie handling

through framework-supported patterns.

---

## Session Storage

Never store access tokens or JWTs in localStorage.

Prefer

- httpOnly cookies
- secure cookies
- server-side session validation

---

## Authorization

Authentication and authorization are separate concerns.

Authentication verifies identity.

Authorization verifies permissions.

Always enforce authorization server-side.

Frontend role checks are UX enhancements only.

Never trust frontend authorization.

---

## Session Validation

Validate sessions on the server whenever possible.

Avoid relying solely on client state.

---

# Security Standards

## Secure by Default

Treat all user input as untrusted.

Validate and sanitize appropriately.

---

## XSS Prevention

Avoid

```tsx
dangerouslySetInnerHTML
```

unless absolutely necessary.

If rendering HTML

- sanitize content
- document why it is required

---

## CSRF Protection

When using cookie-based authentication

- use SameSite cookies
- leverage framework protections
- implement CSRF protection where appropriate

---

## Password Storage

Never store plaintext passwords.

Use strong password hashing.

Examples

- bcrypt
- argon2

---

## Secrets Management

Never commit secrets.

Use environment variables.

Use secret management systems in production.

---

## Rate Limiting

Apply rate limiting to

- authentication endpoints
- sensitive actions
- public APIs

---

## File Upload Security

Validate

- file size
- MIME type
- ownership
- permissions

Never trust client-provided metadata.

---

# NestJS Standards

## Layered Architecture

Controllers

- request handling
- validation
- response shaping

Services

- business logic

Repositories  ORM

- persistence

Avoid business logic inside controllers.

---

## Dependency Injection

Use NestJS dependency injection.

Avoid manually instantiating services.

---

## DTOs

Use DTOs for all request validation.

Use

- class-validator
- class-transformer

Avoid accepting raw request bodies.

---

## Validation

Enable global validation.

Use

```ts
ValidationPipe
```

Requirements

- whitelist
- transform
- reject malformed input

---

## Exception Handling

Use NestJS exception classes.

Examples

- BadRequestException
- UnauthorizedException
- ForbiddenException
- NotFoundException
- ConflictException

Avoid generic Error throws.

Implement exception filters when beneficial.

---

## Guards

Use Guards for

- authentication
- authorization

Avoid duplicating permission logic.

---

## Interceptors

Use Interceptors for

- logging
- transformation
- performance monitoring
- response shaping

Avoid placing cross-cutting concerns inside controllers.

---

## Configuration

Use ConfigModule.

Avoid hardcoded configuration values.

All environment-dependent behavior should come from configuration.

---

# API Design Standards

## REST Consistency

Use predictable endpoint naming.

Prefer

```text
users
projects
comments
tasks
```

over action-based endpoints.

---

## Pagination

Implement pagination for collection endpoints.

Avoid returning unbounded datasets.

---

## Filtering & Sorting

Support filtering, sorting, and pagination through query parameters.

Avoid creating separate endpoints for filter variations.

---

## Response Consistency

Use consistent response structures.

Provide meaningful error responses.

---

# Database Standards

## PostgreSQL Preferred

Prefer PostgreSQL for production systems.

Reasons

- concurrency
- transactions
- relational integrity
- scalability

---

## Prisma

Use relational modeling.

Prefer explicit relations over duplicated text fields.

Use migrations for schema evolution.

Avoid schema drift.

---

## Query Efficiency

Select only required fields.

Avoid over-fetching.

Review N+1 query risks.

Use pagination for large datasets.

---

## Transactions

Use database transactions for multi-step operations that must succeed or fail together.

---

# RBAC Standards

Authorization must be enforced server-side.

Use role-based guards and decorators.

Examples

@Roles(Role.ADMIN)

@Roles(Role.ADMIN, Role.SALES)

Never rely on frontend role checks for security.

Frontend permission checks are UX enhancements only.

Every protected endpoint should explicitly define authorization requirements.

# AI Service Standards

AI integrations must be provider-agnostic.

Business logic should not depend directly on a specific AI provider.

Prefer abstraction layers.

Example

ProposalGenerator Interface

OpenAIProposalGenerator

MockProposalGenerator

Application behavior should continue functioning when AI services are unavailable.

Provide graceful fallbacks whenever practical.

# Realtime Systems

Use WebSockets only when real-time functionality provides meaningful user value.

Examples

- notifications
- collaborative updates
- live activity feeds

Avoid polling when WebSockets are available.

Implement reconnection handling.

---

# Frontend State Management

Prefer local component state first.

Use global state only when necessary.

Examples

- authenticated user
- theme
- global notifications

Avoid unnecessary global state.

---

## Data Fetching Libraries

Prefer

- Server Components
- Next.js fetch

Use libraries such as TanStack Query only when their benefits are justified.

Examples

- caching
- optimistic updates
- realtime synchronization

---

# TypeScript Standards

Use strict typing.

Prefer

- explicit interfaces
- reusable types
- type-safe APIs

Avoid

```ts
any
```

unless absolutely necessary.

Use TypeScript to prevent runtime errors.

---

# Testing Standards

## Linting

Code must pass linting.

---

## Type Checking

Code must pass TypeScript validation.

---

## Unit Tests

Test business logic.

Focus primarily on service-layer behavior.

---

## Integration Tests

Verify interactions between modules.

---

## E2E Tests

Validate real user workflows.

Examples

- authentication
- authorization
- CRUD operations
- critical business flows

---

# CICD Standards

Every pull request should automatically validate

- install
- lint
- typecheck
- tests
- build

Prefer automated verification over manual verification.

---

# Docker Standards

Containers should

- build successfully
- start reliably
- expose health checks
- support environment variables
- support production deployment

Avoid environment-specific assumptions.

---

# Cloud & Infrastructure Standards

Prefer infrastructure that is

- reproducible
- observable
- scalable

Use

- health checks
- structured logging
- monitoring
- environment-based configuration

Design for cloud deployment even if running locally.

---

# Observability

Implement meaningful logging.

Log

- errors
- warnings
- important business events

Avoid logging

- passwords
- tokens
- secrets
- sensitive user information

Use structured logging where practical.

---

# AI Feature Guidelines

AI features should solve real user problems.

Examples

- summarization
- classification
- recommendations
- semantic search
- duplicate detection
- intelligent automation

Avoid AI features that exist only as demos.

Every AI feature should provide measurable user value.

---

# Before Completing Any Change

Verify

- Framework best practices followed
- Security implications reviewed
- Performance implications reviewed
- Lint passes
- Typecheck passes
- Tests pass
- Build passes
- Docker still works
- Documentation updated when necessary
- Solution remains maintainable
- Solution remains production-ready