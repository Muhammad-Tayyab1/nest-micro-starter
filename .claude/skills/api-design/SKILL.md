---
name: api-design
description: Use when adding a new endpoint, service, or TCP message pattern. Defines conventions for NestJS REST controllers, DTOs, Swagger docs, and TCP microservice patterns.
---

## Adding a REST endpoint (gateway)

### 1. Define the DTO in `lib/src/dto/`

```typescript
// lib/src/dto/create-product.dto.ts
import { IsString, IsNumber, Min } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number
}
```

Export from `lib/src/index.ts`.

### 2. Add the message pattern in `lib/src/constants/patterns.ts`

```typescript
export const PRODUCT_PATTERNS = {
  CREATE: 'product.create',
  FIND_ALL: 'product.findAll',
  FIND_ONE: 'product.findOne',
  UPDATE: 'product.update',
  DELETE: 'product.delete',
} as const
```

### 3. Gateway controller

```typescript
@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products' })
  @ApiResponse({ status: 200 })
  findAll() {
    return this.productsService.findAll()
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateProductDto, @Request() req: { user: { userId: string } }) {
    return this.productsService.create(dto, req.user.userId)
  }
}
```

### 4. Gateway service — always wrap with timeout + catchError

```typescript
findAll() {
  return firstValueFrom(
    this.client.send(PRODUCT_PATTERNS.FIND_ALL, {}).pipe(
      timeout(5000),
      catchError(() => throwError(() => new ServiceUnavailableException('Product service unavailable'))),
    ),
  )
}
```

---

## Adding a TCP handler (microservice)

Use `@MessagePattern` for request/reply, `@EventPattern` for fire-and-forget:

```typescript
// Request/reply
@MessagePattern(PRODUCT_PATTERNS.CREATE)
create(@Payload() dto: CreateProductDto & { ownerId: string }) {
  return this.productsService.create(dto)
}

// Fire-and-forget
@EventPattern(NOTIFICATION_PATTERNS.SEND)
send(@Payload() dto: SendNotificationDto) {
  this.notificationsService.send(dto)
}
```

---

## Response shape

The gateway's `ResponseInterceptor` wraps all success responses automatically:

```json
{ "success": true, "statusCode": 200, "data": { ... } }
```

Errors from `HttpExceptionFilter`:

```json
{ "success": false, "statusCode": 404, "message": "Not found", "timestamp": "..." }
```

Services do not need to wrap responses — return plain objects.

---

## Swagger checklist

Every gateway controller must have:

- [ ] `@ApiTags('Name')`
- [ ] `@ApiOperation({ summary: '...' })` on every method
- [ ] `@ApiResponse({ status: 200 })` or `201`
- [ ] `@ApiBearerAuth()` on protected controllers/routes
