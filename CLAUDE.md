# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git workflow

When asked to commit, **only commit — never push**. The user pushes manually via GitHub Desktop.

## Commands

```bash
# Install dependencies
pnpm install

# Development — start all apps concurrently
pnpm run dev

# Start individual apps
pnpm --filter gateway run start:dev
pnpm --filter user-service run start:dev
pnpm --filter product-service run start:dev
pnpm --filter notification-service run start:dev

# Build all
pnpm run build

# Testing
pnpm run test              # Unit tests across all apps
pnpm run test:cov          # Coverage report

# Database
docker-compose up -d                          # Start local PostgreSQL
pnpm --filter <service> run prisma:push       # Sync schema to DB
pnpm --filter <service> run prisma:generate   # Regenerate Prisma client

# Code quality
pnpm run lint              # ESLint across all apps
pnpm run format            # Prettier across all apps
```

## Architecture

This is a **NestJS microservices monorepo** using **pnpm workspaces**, backed by **PostgreSQL** (local Docker), using **Prisma** as the ORM per service.

### Apps

| App | Port | Role |
|-----|------|------|
| `gateway` | 3000 | HTTP entry point — JWT validation, Swagger, routes via TCP |
| `user-service` | TCP 3001 | User CRUD + login |
| `product-service` | TCP 3002 | Product CRUD |
| `notification-service` | TCP 3003 | Fire-and-forget async events |

### Shared packages

- `packages/contracts` — message pattern constants and shared DTOs. Import as `@app/contracts`.

### Request lifecycle (gateway)

Every HTTP request passes through:

1. `JwtAuthGuard` — validates Bearer token (skipped on `/auth/login`)
2. `ValidationPipe` — strips unknown fields, validates DTOs via `class-validator`
3. `ResponseInterceptor` — wraps success: `{ success: true, statusCode, data }`
4. `HttpExceptionFilter` — wraps errors: `{ success: false, statusCode, message }`

### Microservice communication

- Transport: **TCP** via NestJS `ClientsModule`
- Gateway sends messages using `@MessagePattern` constants from `@app/contracts`
- Services expose handlers with `@MessagePattern` — no HTTP in services

### Database

- Each service has its own database: `users_db`, `products_db`, `notifications_db`
- One PostgreSQL container (Docker Compose) hosts all three
- Each service has its own `prisma/schema.prisma`
- After schema changes: run `prisma:push` then `prisma:generate`, restart the service

### Testing conventions

- Unit tests (`*.spec.ts`) mock `PrismaService` and TCP clients with `jest.fn()`
- Call `jest.clearAllMocks()` in `beforeEach`
- Global pipes/interceptors/filters are **not active** in unit tests

### Adding a new service

1. Create `apps/<name>/` — copy structure from an existing service
2. Add Prisma schema + run `prisma:push` and `prisma:generate`
3. Register TCP client in `gateway` using the new service's host/port
4. Add message patterns to `packages/contracts/src/patterns.ts`
5. Add gateway controller + wire up in `AppModule`

### Swagger

- Available at `http://localhost:3000/api/docs`
- Add `@ApiTags`, `@ApiOperation`, `@ApiResponse` to all gateway controllers
- Use `@ApiBearerAuth()` on protected routes
