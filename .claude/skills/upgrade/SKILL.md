---
name: upgrade
description: Use when auditing or upgrading dependencies — quarterly maintenance, security vulnerabilities, or major version releases.
---

## Audit Process

```bash
pnpm outdated
pnpm audit
```

## Categorization

| Category | Action | ADR Required |
|----------|--------|--------------|
| Patch | Apply automatically | No |
| Minor | Apply automatically | No |
| Major | Flag for human decision | Yes (if non-trivial) |
| Security | Apply immediately | No (unless major) |

## Apply Updates

```bash
pnpm update
pnpm test          # all tests must pass
pnpm build         # build must succeed
```

## Critical Dependencies

| Package | Impact |
|---------|--------|
| `@nestjs/*` | All services |
| `prisma` / `@prisma/client` | Database layer |
| `typescript` | Type system |
| `bcryptjs` | Password hashing |
| `passport-jwt` | Auth |

## Workspace Filter Reference

```bash
pnpm --filter gateway <command>
pnpm --filter user-service <command>
pnpm --filter product-service <command>
pnpm --filter notification-service <command>
pnpm --filter @app/contracts <command>
```

## Post-Upgrade Checklist

- [ ] All 8 tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`
- [ ] No new TypeScript errors
- [ ] Prisma client regenerated after `@prisma/client` upgrade: `pnpm run prisma:generate`
- [ ] Swagger docs still load at `http://localhost:3000/api/docs`

## Security Fixes

Apply immediately, run full test suite, then document in `tasks/lessons.md` if the vulnerability revealed a pattern to avoid.
