# nest-micro-starter

A production-ready NestJS microservices starter using pnpm workspaces and TCP transport. Clone, rename, build.

## Stack

| | |
|--|--|
| **Framework** | NestJS 11 |
| **Transport** | TCP (built-in, zero broker dependencies) |
| **Database** | PostgreSQL 16 + Prisma 7 (one DB per service) |
| **Auth** | JWT — validated at gateway, trusted by services |
| **Docs** | Swagger UI at `/api/docs` |
| **Workspace** | pnpm workspaces |
| **Node** | 18+ |

## Services

| Service | Transport | Port | Role |
|---------|-----------|------|------|
| `gateway` | HTTP | 3000 | Entry point — JWT auth, Swagger, TCP proxy |
| `user-service` | TCP | 3001 | User CRUD + bcrypt password validation |
| `product-service` | TCP | 3002 | Product CRUD |
| `notification-service` | TCP | 3003 | Fire-and-forget async events (mock send) |

## Quick Start

**Prerequisites:** Node.js 18+, pnpm 9+, Docker

```bash
git clone https://github.com/Muhammad-Tayyab1/nest-micro-starter.git my-project
cd my-project
pnpm install

# Copy and configure .env files
cp .env.example apps/gateway/.env
# Create .env for each service (see .env.example for values):
#   apps/user-service/.env       → PORT=3001, DATABASE_URL=...
#   apps/product-service/.env    → PORT=3002, DATABASE_URL=...
#   apps/notification-service/.env → PORT=3003, DATABASE_URL=...

docker-compose up -d
pnpm run prisma:push
pnpm run dev
```

Open **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

> Full step-by-step setup: see [SETUP.md](./SETUP.md)

## How It Works

```
Client → Gateway (HTTP:3000, JWT validation)
           ├─ POST /auth/login        → user-service:3001  (validate credentials, issue JWT)
           ├─ * /users                → user-service:3001  (CRUD)
           ├─ * /products             → product-service:3002 (CRUD)
           └─ POST /notifications/send → notification-service:3003 (fire-and-forget)
```

- **Gateway** owns JWT validation — services trust the gateway and never validate tokens themselves
- **TCP only** — services have no HTTP server; all traffic goes through the gateway
- **Shared contracts** in `lib/` — DTOs and message pattern constants imported by all apps as `@app/contracts`
- **Notification pattern** uses `emit` (not `send`) — gateway fires and returns `{ sent: true }` immediately

## Project Structure

```
nest-micro-starter/
├── apps/
│   ├── gateway/              # HTTP + JWT + Swagger + TCP proxy
│   ├── user-service/         # User CRUD, bcrypt, TCP:3001
│   ├── product-service/      # Product CRUD, TCP:3002
│   └── notification-service/ # Async events, TCP:3003
├── lib/                      # @app/contracts — shared across all apps
│   └── src/
│       ├── constants/        # Message pattern strings
│       ├── dto/              # Request DTOs (class-validator + Swagger)
│       ├── dto-response/     # Response shape classes
│       ├── db/               # Shared PrismaModule + PrismaService
│       ├── schema/           # TypeScript interfaces mirroring Prisma models
│       └── env/              # Env validation helpers
├── docker/
│   └── init.sql              # Creates users_db, products_db, notifications_db
├── docker-compose.yml
├── .env.example
└── pnpm-workspace.yaml
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | — | Get JWT token |
| POST | `/users` | JWT | Create user |
| GET | `/users` | JWT | List users |
| GET | `/users/:id` | JWT | Get user |
| PATCH | `/users/:id` | JWT | Update user |
| DELETE | `/users/:id` | JWT | Delete user |
| GET | `/products` | JWT | List products |
| GET | `/products/:id` | JWT | Get product |
| POST | `/products` | JWT | Create product (ownerId from token) |
| PATCH | `/products/:id` | JWT | Update product |
| DELETE | `/products/:id` | JWT | Delete product |
| POST | `/notifications/send` | JWT | Fire-and-forget notification |

## Adding a New Service

1. Copy `apps/product-service/` → `apps/your-service/`
2. Update `name`, `PORT`, `DATABASE_URL` in `package.json` and `.env`
3. Create your Prisma schema + `prisma.config.ts` (see product-service for the Prisma 7 pattern)
4. Run `pnpm --filter your-service run prisma:push` + `prisma:generate`
5. Add message patterns to `lib/src/constants/patterns.ts` and export from `lib/src/index.ts`
6. Register TCP client in the relevant gateway module
7. Add gateway controller + service + module, import in `AppModule`

## Scripts

```bash
pnpm run dev              # Start all 4 apps concurrently
pnpm run build            # Build all apps
pnpm run test             # Unit tests across all apps
pnpm run test:cov         # Coverage report
pnpm run lint             # ESLint across all apps
pnpm run format           # Prettier across all apps
pnpm run prisma:push      # Push all Prisma schemas to DB
pnpm run prisma:generate  # Regenerate all Prisma clients
```

## License

MIT
