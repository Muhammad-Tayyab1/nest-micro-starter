# nest-micro-starter — Design Spec

**Date:** 2026-06-14  
**Status:** Approved

---

## Overview

A public, reusable NestJS microservices starter template using pnpm workspaces. Clone it, rename it, and use it. No project-specific business logic — just the wiring every microservice project needs.

---

## Repository Structure

```
nest-micro-starter/
├── apps/
│   ├── gateway/              # REST API, Swagger docs, JWT validation
│   ├── user-service/         # User CRUD + JWT issuance
│   ├── product-service/      # Product CRUD, demonstrates inter-service call
│   └── notification-service/ # Fire-and-forget async pattern
├── packages/
│   └── contracts/            # Shared message patterns and DTOs
├── docker-compose.yml        # Local PostgreSQL instance
├── .env.example              # All required env vars documented
├── pnpm-workspace.yaml
└── package.json
```

---

## Services

| App | Transport | Port | Role |
|-----|-----------|------|------|
| `gateway` | HTTP | 3000 | Entry point — validates JWT, proxies to services via TCP |
| `user-service` | TCP | 3001 | Owns `users_db` — user CRUD + login |
| `product-service` | TCP | 3002 | Owns `products_db` — product CRUD |
| `notification-service` | TCP | 3003 | Owns `notifications_db` — receives events, mocks send |

---

## Transport

- **TCP** (NestJS built-in `ClientsModule` with `Transport.TCP`)
- Gateway connects to each service as a TCP client
- Services expose message pattern handlers via `@MessagePattern`
- No external broker dependency — zero setup friction

---

## Data Layer

- **PostgreSQL** via Docker Compose (single container, three databases)
  - `users_db`
  - `products_db`
  - `notifications_db`
- **Prisma** per service — each service has its own `schema.prisma`
- Local credentials via `.env` files (`.env.example` at root documents all vars)
- `DATABASE_URL` format: `postgresql://postgres:postgres@localhost:5432/<db_name>`

---

## Authentication

- Gateway owns JWT validation via a global `JwtAuthGuard`
- `POST /auth/login` handled at gateway — calls user-service to verify credentials, issues JWT
- Validated `userId` and `email` forwarded to services as part of the TCP message payload
- Services trust the gateway — no auth guard inside services
- JWT secret in `.env` as `JWT_SECRET`

---

## API Endpoints (all via Gateway, port 3000)

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Validates credentials via user-service, returns JWT |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Products
| Method | Path | Description |
|--------|------|-------------|
| GET | `/products` | List all products |
| GET | `/products/:id` | Get product by ID (includes owner from user-service) |
| POST | `/products` | Create product |
| PATCH | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| POST | `/notifications/send` | Fire-and-forget — emits event to notification-service |

---

## Shared Contracts Package (`packages/contracts`)

Contains all shared types used across apps:

- **Message patterns** — string constants for TCP `@MessagePattern` (e.g. `USER_FIND_ALL`, `PRODUCT_CREATE`)
- **DTOs** — `CreateUserDto`, `CreateProductDto`, `LoginDto`, etc.
- **Response types** — `UserResponse`, `ProductResponse`

All apps import from `@app/contracts` via pnpm workspace alias.

---

## Swagger

- Mounted on gateway at `/api/docs`
- `@ApiTags`, `@ApiOperation`, `@ApiResponse` on all gateway controllers
- `@ApiBearerAuth()` on protected routes
- JWT Bearer auth pre-configured in Swagger UI (`bearerAuth` security scheme)

---

## Docker Compose

```yaml
# Single PostgreSQL container with three databases bootstrapped via init script
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./docker/init.sql:/docker-entrypoint-initdb.d/init.sql
```

`docker/init.sql` creates `users_db`, `products_db`, `notifications_db`.

---

## Environment Variables

```env
# Gateway
PORT=3000
JWT_SECRET=local_jwt_secret

# user-service
USER_SERVICE_HOST=localhost
USER_SERVICE_PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/users_db

# product-service
PRODUCT_SERVICE_HOST=localhost
PRODUCT_SERVICE_PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/products_db

# notification-service
NOTIFICATION_SERVICE_HOST=localhost
NOTIFICATION_SERVICE_PORT=3003
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notifications_db
```

---

## Intentionally Excluded

- No refresh tokens — login returns a single JWT
- No per-service Swagger — all docs on gateway only
- No real email/push sending — notification-service logs only
- No CI/CD config
- No Nx or Turborepo — pnpm workspaces only
- No rate limiting, CORS config, or helmet — left for cloners

---

## Getting Started (README target)

```bash
git clone https://github.com/Muhammad-Tayyab1/nest-micro-starter.git my-project
cd my-project
pnpm install
docker-compose up -d
pnpm run prisma:push   # push schema to all services
pnpm run dev           # starts all apps concurrently
```
