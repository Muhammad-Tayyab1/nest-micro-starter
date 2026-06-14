# nest-micro-starter

A production-ready NestJS microservices starter using pnpm workspaces and TCP transport. Clone, rename, build.

## Stack

- **Framework:** NestJS 10
- **Transport:** TCP (built-in, zero dependencies)
- **Database:** PostgreSQL 16 + Prisma 5 (one DB per service)
- **Auth:** JWT (validated at gateway, trusted by services)
- **Docs:** Swagger at `/api/docs`
- **Workspace:** pnpm workspaces

## Services

| Service | Transport | Port | Role |
|---------|-----------|------|------|
| gateway | HTTP | 3000 | Entry point, JWT auth, Swagger |
| user-service | TCP | 3001 | User CRUD + password validation |
| product-service | TCP | 3002 | Product CRUD |
| notification-service | TCP | 3003 | Async events (mock send) |

## Quick Start

**Prerequisites:** Node.js 18+, pnpm 8+, Docker

```bash
git clone https://github.com/Muhammad-Tayyab1/nest-micro-starter.git my-project
cd my-project
pnpm install

# Create .env files for each app (see .env.example)
cp .env.example apps/gateway/.env
# Edit apps/user-service/.env, apps/product-service/.env, apps/notification-service/.env
# with PORT and DATABASE_URL only (see .env.example comments)

docker-compose up -d
pnpm run prisma:push
pnpm run dev
```

Open [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## How It Works

```
Client → Gateway (HTTP:3000)
           ├─ POST /auth/login                  → user-service (TCP:3001) — validate + issue JWT
           ├─ GET/POST/PATCH/DELETE /users       → user-service (TCP:3001)
           ├─ GET/POST/PATCH/DELETE /products    → product-service (TCP:3002)
           └─ POST /notifications/send           → notification-service (TCP:3003, fire-and-forget)
```

- Gateway validates JWT on all routes except `POST /auth/login` and `POST /users`
- Services communicate only via TCP — no HTTP server in services
- `packages/contracts` holds all shared DTOs and message pattern constants

## Project Structure

```
nest-micro-starter/
├── apps/
│   ├── gateway/              # HTTP + JWT + Swagger
│   ├── user-service/         # User CRUD + bcrypt
│   ├── product-service/      # Product CRUD
│   └── notification-service/ # Fire-and-forget events
├── packages/
│   └── contracts/            # @app/contracts — DTOs + message patterns
├── docker/init.sql           # Creates 3 databases
├── docker-compose.yml
└── .env.example
```

## Adding a New Service

1. Copy `apps/product-service/` → `apps/your-service/`
2. Update `name`, `PORT`, `DATABASE_URL` in `package.json` and `.env`
3. Write your Prisma schema + run `prisma:push` + `prisma:generate`
4. Add message patterns to `packages/contracts/src/patterns.ts` + export from `index.ts`
5. Register TCP client in the relevant gateway module
6. Add gateway controller + service + module

## Running Tests

```bash
pnpm run test          # all services
pnpm run test:cov      # with coverage
```

## License

MIT
