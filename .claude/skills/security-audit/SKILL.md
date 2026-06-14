---
name: security-audit
description: Run a security audit on backend code. Use when adding or modifying auth flows, guards, endpoints that accept user input, or any code handling sensitive data. Also invoke before raising a PR on any of these areas.
---

## Checklist

Work through every section relevant to the code. Skip sections that don't apply. Flag every issue — do not silently fix without reporting.

---

### Authentication & JWT

- [ ] `JwtModule.registerAsync()` used — never `register()` with a hardcoded secret
- [ ] JWT secret read from `ConfigService`, not `process.env` directly
- [ ] `JwtAuthGuard` applied to every protected route/controller
- [ ] Public routes (`POST /auth/login`) are explicitly unguarded and documented
- [ ] Services never validate JWT — gateway only

---

### Passwords & Secrets

- [ ] Passwords hashed with `bcryptjs` before storing
- [ ] No password field returned in any response (check select objects)
- [ ] Webhook secrets compared with `timingSafeEqual`, not string `===`
- [ ] No secrets hardcoded — all from environment variables via `ConfigService`

---

### Input Validation

- [ ] All request bodies have a DTO with `class-validator` decorators
- [ ] `ValidationPipe` with `whitelist: true` is applied globally (check `main.ts`)
- [ ] No raw `req.body` used without a DTO
- [ ] Numeric IDs/values validated with `@IsUUID()`, `@IsNumber()`, etc.

---

### Database

- [ ] No `findMany()` without a scoping `where` clause on tenant-owned tables
- [ ] No raw SQL strings built from user input
- [ ] `findUniqueOrThrow` / `findFirstOrThrow` used instead of manual null checks

---

### Environment

- [ ] No secrets in `.env.example` — only placeholder values
- [ ] `.env` files are gitignored (never committed)
- [ ] No `console.log` leaking sensitive data

---

### TCP Services

- [ ] All gateway TCP calls have `timeout(5000)` and `catchError` wrapping
- [ ] Services return typed objects — no untyped `any` responses

---

## How to Report

**Security Audit — [feature or PR name]**

| Check | Status | Notes |
|-------|--------|-------|
| JWT config | Pass / Fail / N/A | |
| Passwords & secrets | Pass / Fail / N/A | |
| Input validation | Pass / Fail / N/A | |
| Database scoping | Pass / Fail / N/A | |
| Environment | Pass / Fail / N/A | |
| TCP error handling | Pass / Fail / N/A | |

Any Fail must be resolved before the PR is raised.
