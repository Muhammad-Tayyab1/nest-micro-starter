# Setup Guide

Step-by-step guide to clone and run `nest-micro-starter` locally.

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node -v` |
| pnpm | 9+ | `pnpm -v` |
| Docker | any | `docker -v` |
| Docker Compose | any | `docker compose version` |

Install pnpm if missing:
```bash
npm install -g pnpm
```

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/Muhammad-Tayyab1/nest-micro-starter.git my-project
cd my-project
```

---

## Step 2 — Install dependencies

```bash
pnpm install
```

This installs all workspace packages (`gateway`, `user-service`, `product-service`, `notification-service`, `lib`) in one command.

---

## Step 3 — Configure environment files

Each app needs its own `.env` file. Use `.env.example` as reference.

### Gateway (`apps/gateway/.env`)
```env
PORT=3000
JWT_SECRET=local_jwt_secret
USER_SERVICE_HOST=localhost
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_HOST=localhost
PRODUCT_SERVICE_PORT=3002
NOTIFICATION_SERVICE_HOST=localhost
NOTIFICATION_SERVICE_PORT=3003
```

### User service (`apps/user-service/.env`)
```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/starter_db
```

### Product service (`apps/product-service/.env`)
```env
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/starter_db
```

### Notification service (`apps/notification-service/.env`)
```env
PORT=3003
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/starter_db
```

> `.env` files are git-ignored. Never commit them.

---

## Step 4 — Start the database

```bash
docker-compose up -d
```

This starts a single PostgreSQL 16 container on port `5432`. On first run it automatically creates the `starter_db` database.

Verify it's healthy:
```bash
docker ps
# Should show: nest-micro-postgres   Up X seconds (healthy)
```

---

## Step 5 — Push Prisma schema

```bash
pnpm run prisma:push
```

This runs `prisma db push` using the shared schema at `lib/prisma/schema.prisma`, creating all tables (`users`, `products`, `notifications`) in the database.

Then regenerate the Prisma client:
```bash
pnpm run prisma:generate
```

---

## Step 6 — Start all services

```bash
pnpm run dev
```

This starts all four apps concurrently:

```
[gateway]               Gateway running → http://localhost:3000
[gateway]               Swagger docs  → http://localhost:3000/api/docs
[user-service]          User service listening on TCP port 3001
[product-service]       Product service listening on TCP port 3002
[notification-service]  Notification service listening on TCP port 3003
```

---

## Step 7 — Verify with Swagger

Open **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

You should see four tag groups: **Auth**, **Users**, **Products**, **Notifications**.

### Try it out

**1. Create a user**
```
POST /users
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123"
}
```

**2. Login**
```
POST /auth/login
{
  "email": "alice@example.com",
  "password": "password123"
}
```
Copy the `accessToken` from the response.

**3. Authorize in Swagger**

Click the **Authorize** button (top right), paste the token, click **Authorize**.

**4. Create a product**
```
POST /products
{
  "name": "Widget Pro",
  "description": "A very useful widget",
  "price": 29.99
}
```

**5. Send a notification**
```
POST /notifications/send
{
  "to": "alice@example.com",
  "subject": "Welcome",
  "body": "Hello from nest-micro-starter!"
}
```
Returns `{ "sent": true }` immediately (fire-and-forget).

---

## Running tests

```bash
pnpm run test          # unit tests across all services
pnpm run test:cov      # with coverage report
```

Expected output: **8 tests passing** (user-service: 4, product-service: 2, gateway: 2)

---

## Common issues

**`pnpm install` fails — workspace not found**
Make sure you're in the repo root (where `pnpm-workspace.yaml` lives).

**`prisma db push` fails — connection refused**
The Docker container may not be ready yet. Wait 5 seconds and retry, or check: `docker ps` to confirm the container is healthy.

**Service fails to start — `@app/contracts` not resolved**
Run `pnpm install` from the workspace root. The `lib` package must be linked before apps can import it.

**Gateway starts but TCP calls hang**
The downstream service isn't running. Start all services with `pnpm run dev` rather than starting the gateway alone.

**Prisma client errors after schema change**
Run `pnpm run prisma:push && pnpm run prisma:generate`, then restart the affected service.

---

## Customising for your project

1. **Rename** — search and replace `nest-micro-starter` in `package.json` files and `README.md`
2. **Add services** — copy `apps/product-service/`, follow [Adding a New Service](./CLAUDE.md#adding-a-new-service)
3. **Change transport** — swap `Transport.TCP` for `Transport.NATS` or `Transport.RMQ` in each `main.ts` and gateway module
4. **Add a real DB** — update `DATABASE_URL` to point at your hosted PostgreSQL or Supabase instance
5. **Add auth** — the JWT foundation is in `apps/gateway/src/auth/`; extend with refresh tokens, roles, or OAuth as needed
