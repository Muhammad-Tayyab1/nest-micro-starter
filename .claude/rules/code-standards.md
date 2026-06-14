# Code Standards

## Module structure

Follow NestJS module conventions — one module per feature:

```
src/
  feature/
    feature.module.ts
    feature.controller.ts   # gateway only
    feature.service.ts
    feature.service.spec.ts
    dto/
      create-feature.dto.ts
      update-feature.dto.ts
```

Services live in `apps/`. Shared contracts (DTOs, patterns, PrismaService) live in `lib/` and are imported as `@app/contracts`.

---

## Shared contracts

Always import from `@app/contracts` — never from relative paths across package boundaries.

```typescript
// Wrong
import { CreateUserDto } from '../../../lib/src/dto/user.dto'

// Correct
import { CreateUserDto, USER_PATTERNS, PrismaService } from '@app/contracts'
```

---

## DTOs

All DTOs must use `class-validator` decorators and `@ApiProperty` for Swagger.

```typescript
import { IsString, IsEmail, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty({ minLength: 6 })
  @MinLength(6)
  password: string
}
```

---

## Services

- One service per feature, one responsibility per method
- Services receive `tenantId` or `userId` as explicit parameters — never read from a global
- Never catch errors silently — let them propagate so the gateway's `HttpExceptionFilter` handles them

```typescript
// Correct
async findOne(id: string): Promise<UserResponse> {
  const user = await this.prisma.user.findUniqueOrThrow({ where: { id } })
  return user
}
```

---

## Gateway communication

- Use `firstValueFrom()` with `timeout(5000)` and `catchError` for all TCP calls
- Never use raw `clientProxy.send()` without wrapping in `firstValueFrom()`

```typescript
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs'
import { ServiceUnavailableException } from '@nestjs/common'

return firstValueFrom(
  this.client.send(USER_PATTERNS.FIND_ONE, id).pipe(
    timeout(5000),
    catchError(() => throwError(() => new ServiceUnavailableException('User service unavailable'))),
  ),
)
```

---

## Message patterns

All TCP pattern strings live in `lib/src/constants/patterns.ts`. Never hardcode pattern strings in controllers or services.

---

## File naming

- Modules: `feature.module.ts`
- Controllers: `feature.controller.ts`
- Services: `feature.service.ts`
- Tests: `feature.service.spec.ts`
- DTOs: `create-feature.dto.ts`, `update-feature.dto.ts`

---

## No `console.log`

No `console.log` in committed code. Use NestJS `Logger`:

```typescript
import { Logger } from '@nestjs/common'
private readonly logger = new Logger(MyService.name)
this.logger.log('Processing request')
```

---

## Branch naming

```
feat/<short-description>
fix/<short-description>
chore/<short-description>
docs/<short-description>
```
