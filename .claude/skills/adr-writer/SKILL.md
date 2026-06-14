---
name: adr-writer
description: Create Architecture Decision Records for significant technical choices. Use for transport changes, ORM choices, auth patterns, and non-trivial migrations.
---

## ADR Location

ADRs live in `docs/adr/` in the repo.

## File Naming

```
docs/adr/
  0001-use-tcp-transport.md
  0002-shared-prisma-schema-in-lib.md
  0003-jwt-validation-at-gateway-only.md
```

Format: `{4-digit-number}-{kebab-case-title}.md`

## ADR Template

```markdown
# {Number}. {Title}

Date: {YYYY-MM-DD}

## Status

{Proposed | Accepted | Deprecated | Superseded by [ADR-XXXX](link)}

## Context

{What problem or decision is this addressing?}

## Decision

{What was decided?}

## Consequences

### Positive

- {Benefit}

### Negative

- {Drawback}

### Neutral

- {Observation}

## Alternatives Considered

### {Alternative}

{Why it was rejected}
```

## Example ADR

```markdown
# 0001. Use TCP Transport for Microservice Communication

Date: 2025-06-14

## Status

Accepted

## Context

Services need to communicate. Options include TCP, NATS, RabbitMQ, and gRPC.
For a starter template, we want zero external dependencies.

## Decision

Use NestJS built-in TCP transport via `ClientsModule` with `Transport.TCP`.

## Consequences

### Positive

- Zero broker dependencies — no RabbitMQ or NATS to run locally
- Simple setup for cloners

### Negative

- Not durable — fire-and-forget events are lost if service is down
- Not suitable for high-throughput production workloads

### Neutral

- Swap to NATS or RabbitMQ by changing `Transport.TCP` to `Transport.NATS` in each module

## Alternatives Considered

### NATS

Better for production but requires a running NATS server — adds friction for a starter.
```

## When to Write an ADR

- Changing transport (TCP → NATS/RMQ)
- Changing ORM or database
- Changing auth strategy
- Any decision a future developer would question without context
