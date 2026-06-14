# Security Rules

## Environment variables

Never hardcode secrets, tokens, or credentials in source code. All secrets go in `.env` files which are gitignored.

Only `.env.example` with placeholder values is committed.

---

## JWT

JWT validation happens at the **gateway only**. Services trust the gateway and never validate tokens.

- Never store JWT secrets in code — always read from `ConfigService`
- Use `JwtModule.registerAsync()` with `ConfigService` injection — never `JwtModule.register()` with a hardcoded secret
- Never log JWT tokens or expose them in error messages

---

## Passwords

- Always hash passwords with `bcryptjs` before storing
- Never return password fields in responses — use a select object that excludes `password`
- Never log raw passwords

```typescript
// Exclude password from all queries
const USER_SELECT = { id: true, name: true, email: true, createdAt: true, updatedAt: true, password: false }
```

---

## Database

- Every query on a tenant-scoped table must filter by `tenantId` or the owning entity
- Never expose a `findMany()` without a scoping `where` clause
- Use `findUniqueOrThrow` / `findFirstOrThrow` instead of null-checking manually

---

## TCP services

- Services never validate JWT — they trust the gateway
- Services never accept raw user input that hasn't been validated by a DTO at the gateway layer

---

## Timing-safe comparisons

For webhook secrets and API keys, always use `timingSafeEqual`:

```typescript
import { timingSafeEqual } from 'crypto'

const a = Buffer.from(incoming)
const b = Buffer.from(process.env.SECRET!)
if (a.length !== b.length || !timingSafeEqual(a, b)) {
  throw new UnauthorizedException()
}
```

---

## Code review flags

- Hardcoded secrets, tokens, or credentials in any file
- `JwtModule.register()` with a literal secret string
- Password fields returned in any API response
- `findMany()` without a scoping `where` clause
- String comparison (`===`) used for secrets instead of `timingSafeEqual`
