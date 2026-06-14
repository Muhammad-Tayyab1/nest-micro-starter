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
docker-compose up -d                                    # Start local PostgreSQL
pnpm --filter <service> run prisma:push                 # Sync schema to DB
pnpm --filter <service> run prisma:generate             # Regenerate Prisma client
pnpm run prisma:push                                    # Push all services at once
pnpm run prisma:generate                                # Regenerate all clients

# Code quality
pnpm run lint              # ESLint across all apps
pnpm run format            # Prettier across all apps
```

## Architecture

This is a **NestJS 11 microservices monorepo** using **pnpm workspaces**, backed by a single **PostgreSQL** database (`starter_db`, local Docker), using **Prisma 7** as the ORM via a shared schema in `lib/`.

### Apps

| App | Port | Role |
|-----|------|------|
| `gateway` | HTTP 3000 | Entry point — JWT validation, Swagger, routes via TCP |
| `user-service` | TCP 3001 | User CRUD + bcrypt login |
| `product-service` | TCP 3002 | Product CRUD |
| `notification-service` | TCP 3003 | Fire-and-forget async events |

### Shared library

- `lib/` (package name `@app/contracts`) — all code shared across apps
  - `lib/src/constants/patterns.ts` — TCP message pattern strings (`USER_PATTERNS`, `PRODUCT_PATTERNS`, `NOTIFICATION_PATTERNS`)
  - `lib/src/dto/` — request DTOs with class-validator + Swagger decorators
  - `lib/src/dto-response/` — response shape classes
  - `lib/src/db/` — shared `PrismaModule` and `PrismaService`
  - `lib/src/generated/prisma-client/` — generated Prisma client (committed, do not edit manually)

Import anything shared as:
```typescript
import { USER_PATTERNS, CreateUserDto, PrismaModule, PrismaService } from '@app/contracts';
```

### Request lifecycle (gateway)

Every HTTP request passes through:

1. `ValidationPipe` — strips unknown fields, validates DTOs via `class-validator`
2. `JwtAuthGuard` — validates Bearer token (applied per-route or per-controller)
3. `ResponseInterceptor` — wraps success: `{ success: true, statusCode, data }`
4. `HttpExceptionFilter` — wraps errors: `{ success: false, statusCode, message, timestamp }`

Public routes (no JWT): `POST /auth/login`

### Microservice communication

- Transport: **TCP** via NestJS `ClientsModule`
- Gateway sends **request/reply** using `clientProxy.send()` + `firstValueFrom()` for most routes
- Gateway sends **fire-and-forget** using `clientProxy.emit()` for notifications (no response expected)
- Services expose `@MessagePattern` handlers for request/reply
- Services expose `@EventPattern` handlers for fire-and-forget events
- Services **never** validate JWT — they trust the gateway

### Prisma 7 conventions

The Prisma schema lives at `lib/prisma/schema.prisma` — one shared schema for all services. The `prisma.config.ts` lives at `lib/prisma.config.ts`. The schema.prisma does **not** include the `url` field in the datasource; that lives in `prisma.config.ts`.

`PrismaModule` and `PrismaService` are exported from `@app/contracts` — import them from there, never from a local `./prisma/` path.

After schema changes:
1. `pnpm run prisma:push` — runs from repo root, targets `@app/contracts`
2. `pnpm run prisma:generate` — regenerates the client at `lib/src/generated/prisma-client/`
3. Restart all services

### TypeScript path aliases

Each app's `tsconfig.json` maps `@app/contracts` to `../../lib/src`. The jest config maps it via `moduleNameMapper` to `<rootDir>/../../../lib/src`. Do not change these paths — they must stay in sync.

### Testing conventions

- Unit tests (`*.spec.ts`) mock `PrismaService` and TCP `ClientProxy` with `jest.fn()`
- Call `jest.clearAllMocks()` in `afterEach`
- Global pipes/interceptors/filters are **not active** in unit tests
- Gateway tests use `diagnostics: false` in ts-jest to avoid Prisma transitive import errors (Prisma is not installed in gateway)

### Adding a new service

1. Copy `apps/product-service/` — it is the canonical service template
2. Update `name`, `PORT`, `DATABASE_URL` in `package.json` and `.env`
3. Add any new models to `lib/prisma/schema.prisma`, then run `pnpm run prisma:push` and `pnpm run prisma:generate` from the repo root
4. Import `PrismaModule` from `@app/contracts` in the new service's `app.module.ts`
5. Add message patterns to `lib/src/constants/patterns.ts` + export from `lib/src/index.ts`
6. Register TCP client in the relevant gateway module (`ClientsModule.register`)
7. Add gateway controller + service + module, import in `apps/gateway/src/app.module.ts`

### Swagger

- Available at `http://localhost:3000/api/docs`
- Add `@ApiTags`, `@ApiOperation`, `@ApiResponse` to all gateway controllers
- Use `@ApiBearerAuth()` on protected routes/controllers
- Swagger is only on the gateway — services have no HTTP layer
