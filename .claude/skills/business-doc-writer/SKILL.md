---
name: business-doc-writer
description: Write a structured feature document to docs/features/ before any commit containing business logic. Never write code-level detail — business intent only.
---

## When This Skill Fires

Fires **only for business logic** — changes that affect what the API returns, what gets stored, or how auth works.

**Fires for:** new endpoints, new services, auth changes, schema changes, permission changes.

**Skip for:** CLAUDE.md updates, CI/CD config, lint rules, dependency upgrades with no behaviour change.

---

## Doc File Path

Derived from the branch name:

```
feat/add-product-service  →  docs/features/add-product-service.md
fix/auth-token-expiry     →  docs/features/fix-auth-token-expiry.md
```

---

## Document Structure

```markdown
---
feature: { human-readable name }
branch: { branch name }
date: { YYYY-MM-DD }
status: draft
confidence: high | medium | low
---

# {Feature Name}

> ⚠️ Low business context — developer should review before merge.
> _(Remove if confidence is medium or high)_

## What Was Built

{What API capability exists now that didn't before?}

## Why

{What problem does this solve? Write "Not stated." if not mentioned.}

## Who It Affects

{Which consumers: web client, admin, external API, other services?}

## Endpoints / Patterns Added or Changed

| Method / Pattern | Path / Key | Auth | Description |
|-----------------|------------|------|-------------|
| POST | `/users` | JWT | Create user |

## Business Rules

{Bullet list of explicit rules. Write "None stated." if none mentioned.}

## Data Touched

| Entity | Operation |
|--------|-----------|
| User | Create, Read |

## Open Questions

{Unresolved decisions. Write "None." if none.}
```

---

## Write and Stage

1. Create `docs/features/` if missing.
2. Merge if file exists — never overwrite blindly.
3. `git add docs/features/{filename}.md`
4. Include in the same commit as the code.
