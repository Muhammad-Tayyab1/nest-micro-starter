---
name: unit-test-generator
description: Write unit tests for NestJS services and controllers. Use when creating or updating any service or controller.
---

## Scope

- Write tests for `*.service.ts` and `*.controller.ts` files in `apps/`
- Do NOT test `lib/` — it has no business logic
- Focus on unit tests — mock all dependencies

## Automatic Test Generation

**CRITICAL**: Whenever you build or update a service or controller, you MUST write/update tests. This is not optional. Never mark a task complete without passing tests.

## Test Location

Tests live alongside the file they test:

```
apps/user-service/src/users/
  users.service.ts
  users.service.spec.ts       ← same folder
  users.controller.ts
  users.controller.spec.ts
```

## Mocking Pattern

Mock `PrismaService` and `ClientProxy` with plain `jest.fn()` objects:

```typescript
import { Test } from '@nestjs/testing'
import { UsersService } from './users.service'
import { PrismaService } from '@app/contracts'

describe('UsersService', () => {
  let service: UsersService
  let prisma: { user: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock } }

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    }

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get(UsersService)
  })

  afterEach(() => jest.clearAllMocks())

  describe('findAll', () => {
    it('returns all users', async () => {
      const users = [{ id: '1', name: 'Alice', email: 'alice@example.com' }]
      prisma.user.findMany.mockResolvedValue(users)

      const result = await service.findAll()

      expect(result).toEqual(users)
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1)
    })
  })
})
```

## Gateway Service Mocking

For gateway services that use `ClientProxy`, mock with an observable:

```typescript
import { of } from 'rxjs'
import { getModelToken } from '@nestjs/microservices'

const mockClient = {
  send: jest.fn().mockReturnValue(of({ id: '1', name: 'Alice' })),
  emit: jest.fn(),
}

{ provide: 'USER_SERVICE', useValue: mockClient }
```

## Test Structure

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('returns expected result on success', async () => { ... })
    it('throws when resource not found', async () => { ... })
    it('handles empty list', async () => { ... })
  })
})
```

## Running Tests

```bash
pnpm test                              # all services
pnpm --filter user-service test        # single service
pnpm --filter user-service test:cov    # with coverage
```

## Coverage Target

- Minimum: 80% for new code
- Services: 90% (critical business logic)

## Test Checklist

- [ ] Happy path tested
- [ ] Error case tested (not found, invalid input)
- [ ] Mocks called with correct arguments (`toHaveBeenCalledWith`)
- [ ] `jest.clearAllMocks()` in `afterEach`
- [ ] Tests pass: `pnpm test`
