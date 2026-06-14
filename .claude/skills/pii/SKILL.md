---
name: pii
description: When working with any code that handles personal data — user profiles, emails, passwords, tokens, etc.
---

## PII Tiers

### Tier 1 — Never log or return

- Passwords (raw or hashed)
- Auth tokens, refresh tokens, session tokens
- Payment card data

### Tier 2 — Log with caution

- Email address — use structured fields only, never string interpolation
- Phone number — last 4 digits only if needed

### Tier 3 — Log freely

- User ID, record ID
- First name in isolation

## Rules

### Responses

Never return password fields in any response. Use explicit select objects:

```typescript
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  password: false,   // explicitly excluded
}
```

### Logging

```typescript
// Bad
this.logger.log(`User ${email} logged in`)

// Good
this.logger.log('User login', { userId })
```

### Storage

- Never store raw passwords — always hash with `bcryptjs` before saving
- Never store tokens in the database unless they are hashed

### URLs

Never put PII in URL path segments or query params.

### Code Review Flags

- Password field included in any response object
- Email or token in a log string (not a structured field)
- Raw password stored without hashing
- Token returned in a response body (should only be in controlled auth responses)
