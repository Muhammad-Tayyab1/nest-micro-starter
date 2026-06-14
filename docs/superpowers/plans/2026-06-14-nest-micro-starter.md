# nest-micro-starter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a reusable NestJS microservices monorepo with gateway, user-service, product-service, and notification-service wired via TCP, backed by PostgreSQL, with Swagger docs and JWT auth.

**Architecture:** pnpm workspaces with a shared `@app/contracts` package for DTOs and message patterns. Gateway owns HTTP + JWT validation and proxies to services via TCP ClientProxy. Services expose `@MessagePattern` / `@EventPattern` handlers with no HTTP layer.

**Tech Stack:** NestJS 10, pnpm workspaces, Prisma 5, PostgreSQL 16 (Docker), passport-jwt, @nestjs/swagger, class-validator, bcryptjs, concurrently

---

## File Map

```
nest-micro-starter/
├── package.json                          # root workspace scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .prettierrc
├── .eslintrc.js
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docker/init.sql
├── packages/
│   └── contracts/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── patterns.ts
│           └── dto/
│               ├── auth.dto.ts
│               ├── user.dto.ts
│               ├── product.dto.ts
│               └── notification.dto.ts
├── apps/
│   ├── gateway/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── .env
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── common/
│   │       │   ├── interceptors/response.interceptor.ts
│   │       │   └── filters/http-exception.filter.ts
│   │       ├── auth/
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── auth.service.spec.ts
│   │       │   ├── jwt.strategy.ts
│   │       │   └── jwt-auth.guard.ts
│   │       ├── users/
│   │       │   ├── users.module.ts
│   │       │   ├── users.controller.ts
│   │       │   └── users.service.ts
│   │       ├── products/
│   │       │   ├── products.module.ts
│   │       │   ├── products.controller.ts
│   │       │   └── products.service.ts
│   │       └── notifications/
│   │           ├── notifications.module.ts
│   │           ├── notifications.controller.ts
│   │           └── notifications.service.ts
│   ├── user-service/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── .env
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── prisma/
│   │       │   ├── prisma.module.ts
│   │       │   └── prisma.service.ts
│   │       └── users/
│   │           ├── users.module.ts
│   │           ├── users.controller.ts
│   │           ├── users.service.ts
│   │           └── users.service.spec.ts
│   ├── product-service/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── .env
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── prisma/
│   │       │   ├── prisma.module.ts
│   │       │   └── prisma.service.ts
│   │       └── products/
│   │           ├── products.module.ts
│   │           ├── products.controller.ts
│   │           ├── products.service.ts
│   │           └── products.service.spec.ts
│   └── notification-service/
│       ├── package.json
│       ├── tsconfig.json
│       ├── nest-cli.json
│       ├── .env
│       ├── prisma/schema.prisma
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── prisma/
│           │   ├── prisma.module.ts
│           │   └── prisma.service.ts
│           └── notifications/
│               ├── notifications.module.ts
│               ├── notifications.controller.ts
│               └── notifications.service.ts
└── README.md
```

---

## Task 1: Root monorepo scaffolding

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.prettierrc`
- Create: `.eslintrc.js`
- Create: `.gitignore`

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "nest-micro-starter",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm --filter gateway run start:dev\" \"pnpm --filter user-service run start:dev\" \"pnpm --filter product-service run start:dev\" \"pnpm --filter notification-service run start:dev\"",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "format": "pnpm -r run format",
    "prisma:push": "pnpm --filter user-service run prisma:push && pnpm --filter product-service run prisma:push && pnpm --filter notification-service run prisma:push",
    "prisma:generate": "pnpm --filter user-service run prisma:generate && pnpm --filter product-service run prisma:generate && pnpm --filter notification-service run prisma:generate"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "typescript": "^5.1.3",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

- [ ] **Step 4: Create `.prettierrc`**

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 5: Create `.eslintrc.js`**

```js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { project: 'tsconfig.json', sourceType: 'module' },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: { node: true, jest: true },
  ignorePatterns: ['.eslintrc.js'],
  rules: { '@typescript-eslint/interface-name-prefix': 'off', '@typescript-eslint/explicit-module-boundary-types': 'off', '@typescript-eslint/no-explicit-any': 'off' },
};
```

- [ ] **Step 6: Create `.gitignore`**

```
node_modules
dist
.env
*.env.local
coverage
.DS_Store
```

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json .prettierrc .eslintrc.js .gitignore
git commit -m "chore: root monorepo scaffolding"
```

---

## Task 2: Contracts package

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/patterns.ts`
- Create: `packages/contracts/src/dto/auth.dto.ts`
- Create: `packages/contracts/src/dto/user.dto.ts`
- Create: `packages/contracts/src/dto/product.dto.ts`
- Create: `packages/contracts/src/dto/notification.dto.ts`
- Create: `packages/contracts/src/index.ts`

- [ ] **Step 1: Create `packages/contracts/package.json`**

```json
{
  "name": "@app/contracts",
  "version": "0.0.1",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@nestjs/swagger": "^7.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "typescript": "^5.1.3"
  }
}
```

- [ ] **Step 2: Create `packages/contracts/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `packages/contracts/src/patterns.ts`**

```typescript
export const USER_PATTERNS = {
  FIND_ALL: 'user.find_all',
  FIND_ONE: 'user.find_one',
  FIND_BY_EMAIL: 'user.find_by_email',
  VALIDATE: 'user.validate',
  CREATE: 'user.create',
  UPDATE: 'user.update',
  DELETE: 'user.delete',
} as const;

export const PRODUCT_PATTERNS = {
  FIND_ALL: 'product.find_all',
  FIND_ONE: 'product.find_one',
  CREATE: 'product.create',
  UPDATE: 'product.update',
  DELETE: 'product.delete',
} as const;

export const NOTIFICATION_PATTERNS = {
  SEND: 'notification.send',
} as const;
```

- [ ] **Step 4: Create `packages/contracts/src/dto/auth.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}
```

- [ ] **Step 5: Create `packages/contracts/src/dto/user.dto.ts`**

```typescript
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 6: Create `packages/contracts/src/dto/product.dto.ts`**

```typescript
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Widget Pro' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A very useful widget' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @IsPositive()
  price: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductResponse {
  id: string;
  name: string;
  description?: string;
  price: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 7: Create `packages/contracts/src/dto/notification.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Welcome!' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Hello, welcome to our platform.' })
  @IsString()
  body: string;
}
```

- [ ] **Step 8: Create `packages/contracts/src/index.ts`**

```typescript
export * from './patterns';
export * from './dto/auth.dto';
export * from './dto/user.dto';
export * from './dto/product.dto';
export * from './dto/notification.dto';
```

- [ ] **Step 9: Commit**

```bash
git add packages/
git commit -m "feat(contracts): add shared DTOs and message patterns"
```

---

## Task 3: Docker + DB setup

**Files:**
- Create: `docker-compose.yml`
- Create: `docker/init.sql`
- Create: `.env.example`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: nest-micro-postgres
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./docker/init.sql:/docker-entrypoint-initdb.d/init.sql
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

- [ ] **Step 2: Create `docker/init.sql`**

```sql
CREATE DATABASE users_db;
CREATE DATABASE products_db;
CREATE DATABASE notifications_db;
```

- [ ] **Step 3: Create `.env.example`**

```env
# ── Gateway (apps/gateway/.env) ──────────────────────────
PORT=3000
JWT_SECRET=local_jwt_secret
USER_SERVICE_HOST=localhost
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_HOST=localhost
PRODUCT_SERVICE_PORT=3002
NOTIFICATION_SERVICE_HOST=localhost
NOTIFICATION_SERVICE_PORT=3003

# ── User Service (apps/user-service/.env) ────────────────
# PORT=3001
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/users_db

# ── Product Service (apps/product-service/.env) ──────────
# PORT=3002
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/products_db

# ── Notification Service (apps/notification-service/.env) ─
# PORT=3003
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notifications_db
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml docker/ .env.example
git commit -m "chore: add docker-compose and DB init script"
```

---

## Task 4: User service — scaffolding

**Files:**
- Create: `apps/user-service/package.json`
- Create: `apps/user-service/tsconfig.json`
- Create: `apps/user-service/nest-cli.json`
- Create: `apps/user-service/.env`
- Create: `apps/user-service/prisma/schema.prisma`
- Create: `apps/user-service/src/main.ts`
- Create: `apps/user-service/src/app.module.ts`
- Create: `apps/user-service/src/prisma/prisma.service.ts`
- Create: `apps/user-service/src/prisma/prisma.module.ts`

- [ ] **Step 1: Create `apps/user-service/package.json`**

```json
{
  "name": "user-service",
  "version": "0.0.1",
  "scripts": {
    "start:dev": "nest start --watch",
    "start": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:cov": "jest --coverage",
    "lint": "eslint \"{src}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:push": "prisma db push",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@app/contracts": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "rxjs": "^7.8.0",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcryptjs": "^2.4.2",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "jest": "^29.5.0",
    "prisma": "^5.0.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@app/contracts(|/.*)$": "<rootDir>/../../packages/contracts/src$1"
    }
  }
}
```

- [ ] **Step 2: Create `apps/user-service/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@app/contracts": ["../../packages/contracts/src"],
      "@app/contracts/*": ["../../packages/contracts/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/user-service/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "tsConfigPath": "tsconfig.json"
  }
}
```

- [ ] **Step 4: Create `apps/user-service/.env`**

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/users_db
```

- [ ] **Step 5: Create `apps/user-service/prisma/schema.prisma`**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 6: Create `apps/user-service/src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

- [ ] **Step 7: Create `apps/user-service/src/prisma/prisma.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 8: Create `apps/user-service/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, UsersModule],
})
export class AppModule {}
```

- [ ] **Step 9: Create `apps/user-service/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '3001', 10),
    },
  });
  await app.listen();
  console.log('User service listening on TCP port', process.env.PORT || 3001);
}
bootstrap();
```

- [ ] **Step 10: Commit**

```bash
git add apps/user-service/
git commit -m "feat(user-service): scaffold NestJS microservice with Prisma"
```

---

## Task 5: User service — handlers + tests

**Files:**
- Create: `apps/user-service/src/users/users.service.ts`
- Create: `apps/user-service/src/users/users.service.spec.ts`
- Create: `apps/user-service/src/users/users.controller.ts`
- Create: `apps/user-service/src/users/users.module.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/user-service/src/users/users.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns users list', async () => {
      const users = [{ id: '1', name: 'Alice', email: 'alice@test.com', createdAt: new Date(), updatedAt: new Date() }];
      mockPrisma.user.findMany.mockResolvedValue(users);
      expect(await service.findAll()).toEqual(users);
      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('validate', () => {
    it('returns user without password when credentials are valid', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Alice', password: hashed, createdAt: new Date(), updatedAt: new Date() });
      const result = await service.validate('a@b.com', 'secret');
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('a@b.com');
    });

    it('returns null when password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Alice', password: hashed, createdAt: new Date(), updatedAt: new Date() });
      expect(await service.validate('a@b.com', 'wrong')).toBeNull();
    });

    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      expect(await service.validate('x@x.com', 'pw')).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/user-service && pnpm test -- --testPathPattern=users.service
```

Expected: FAIL — `Cannot find module './users.service'`

- [ ] **Step 3: Create `apps/user-service/src/users/users.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto } from '@app/contracts';
import { PrismaService } from '../prisma/prisma.service';

const USER_SELECT = { id: true, name: true, email: true, createdAt: true, updatedAt: true, password: false };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async validate(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async create(dto: CreateUserDto) {
    const password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({ data: { ...dto, password }, select: USER_SELECT });
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.update({ where: { id }, data, select: USER_SELECT });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id }, select: { id: true } });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/user-service && pnpm test -- --testPathPattern=users.service
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Create `apps/user-service/src/users/users.controller.ts`**

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { USER_PATTERNS, CreateUserDto, UpdateUserDto } from '@app/contracts';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(USER_PATTERNS.FIND_ALL)
  findAll() {
    return this.usersService.findAll();
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE)
  findOne(@Payload() id: string) {
    return this.usersService.findOne(id);
  }

  @MessagePattern(USER_PATTERNS.FIND_BY_EMAIL)
  findByEmail(@Payload() email: string) {
    return this.usersService.findByEmail(email);
  }

  @MessagePattern(USER_PATTERNS.VALIDATE)
  validate(@Payload() data: { email: string; password: string }) {
    return this.usersService.validate(data.email, data.password);
  }

  @MessagePattern(USER_PATTERNS.CREATE)
  create(@Payload() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @MessagePattern(USER_PATTERNS.UPDATE)
  update(@Payload() data: { id: string; dto: UpdateUserDto }) {
    return this.usersService.update(data.id, data.dto);
  }

  @MessagePattern(USER_PATTERNS.DELETE)
  remove(@Payload() id: string) {
    return this.usersService.remove(id);
  }
}
```

- [ ] **Step 6: Create `apps/user-service/src/users/users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 7: Commit**

```bash
git add apps/user-service/src/users/
git commit -m "feat(user-service): add message handlers and unit tests"
```

---

## Task 6: Product service — full setup

**Files:**
- Create: `apps/product-service/package.json`
- Create: `apps/product-service/tsconfig.json`
- Create: `apps/product-service/nest-cli.json`
- Create: `apps/product-service/.env`
- Create: `apps/product-service/prisma/schema.prisma`
- Create: `apps/product-service/src/main.ts`
- Create: `apps/product-service/src/app.module.ts`
- Create: `apps/product-service/src/prisma/prisma.service.ts`
- Create: `apps/product-service/src/prisma/prisma.module.ts`
- Create: `apps/product-service/src/products/products.service.ts`
- Create: `apps/product-service/src/products/products.service.spec.ts`
- Create: `apps/product-service/src/products/products.controller.ts`
- Create: `apps/product-service/src/products/products.module.ts`

- [ ] **Step 1: Create `apps/product-service/package.json`**

```json
{
  "name": "product-service",
  "version": "0.0.1",
  "scripts": {
    "start:dev": "nest start --watch",
    "start": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:cov": "jest --coverage",
    "lint": "eslint \"{src}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:push": "prisma db push",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@app/contracts": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@prisma/client": "^5.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "rxjs": "^7.8.0",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "jest": "^29.5.0",
    "prisma": "^5.0.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@app/contracts(|/.*)$": "<rootDir>/../../packages/contracts/src$1"
    }
  }
}
```

- [ ] **Step 2: Create `apps/product-service/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@app/contracts": ["../../packages/contracts/src"],
      "@app/contracts/*": ["../../packages/contracts/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/product-service/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true, "tsConfigPath": "tsconfig.json" }
}
```

- [ ] **Step 4: Create `apps/product-service/.env`**

```env
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/products_db
```

- [ ] **Step 5: Create `apps/product-service/prisma/schema.prisma`**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Float
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

- [ ] **Step 6: Create PrismaService + PrismaModule** (identical to user-service)

`apps/product-service/src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

`apps/product-service/src/prisma/prisma.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

- [ ] **Step 7: Create `apps/product-service/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: parseInt(process.env.PORT || '3002', 10) },
  });
  await app.listen();
  console.log('Product service listening on TCP port', process.env.PORT || 3002);
}
bootstrap();
```

- [ ] **Step 8: Create `apps/product-service/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, ProductsModule],
})
export class AppModule {}
```

- [ ] **Step 9: Write the failing test**

Create `apps/product-service/src/products/products.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('findAll returns all products', async () => {
    const products = [{ id: '1', name: 'Widget', description: null, price: 9.99, ownerId: 'u1', createdAt: new Date(), updatedAt: new Date() }];
    mockPrisma.product.findMany.mockResolvedValue(products);
    expect(await service.findAll()).toEqual(products);
    expect(mockPrisma.product.findMany).toHaveBeenCalledTimes(1);
  });

  it('create stores product with ownerId', async () => {
    const dto = { name: 'Widget', price: 9.99, ownerId: 'u1' };
    const created = { id: '1', ...dto, description: null, createdAt: new Date(), updatedAt: new Date() };
    mockPrisma.product.create.mockResolvedValue(created);
    expect(await service.create(dto)).toEqual(created);
    expect(mockPrisma.product.create).toHaveBeenCalledWith({ data: dto });
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

```bash
cd apps/product-service && pnpm test -- --testPathPattern=products.service
```

Expected: FAIL — `Cannot find module './products.service'`

- [ ] **Step 11: Create `apps/product-service/src/products/products.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from '@app/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany();
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  create(dto: CreateProductDto & { ownerId: string }) {
    return this.prisma.product.create({ data: dto });
  }

  update(id: string, dto: UpdateProductDto) {
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
```

- [ ] **Step 12: Run test to verify it passes**

```bash
cd apps/product-service && pnpm test -- --testPathPattern=products.service
```

Expected: PASS — 2 tests passing

- [ ] **Step 13: Create `apps/product-service/src/products/products.controller.ts`**

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PRODUCT_PATTERNS, CreateProductDto, UpdateProductDto } from '@app/contracts';
import { ProductsService } from './products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern(PRODUCT_PATTERNS.FIND_ALL)
  findAll() {
    return this.productsService.findAll();
  }

  @MessagePattern(PRODUCT_PATTERNS.FIND_ONE)
  findOne(@Payload() id: string) {
    return this.productsService.findOne(id);
  }

  @MessagePattern(PRODUCT_PATTERNS.CREATE)
  create(@Payload() dto: CreateProductDto & { ownerId: string }) {
    return this.productsService.create(dto);
  }

  @MessagePattern(PRODUCT_PATTERNS.UPDATE)
  update(@Payload() data: { id: string; dto: UpdateProductDto }) {
    return this.productsService.update(data.id, data.dto);
  }

  @MessagePattern(PRODUCT_PATTERNS.DELETE)
  remove(@Payload() id: string) {
    return this.productsService.remove(id);
  }
}
```

- [ ] **Step 14: Create `apps/product-service/src/products/products.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({ controllers: [ProductsController], providers: [ProductsService] })
export class ProductsModule {}
```

- [ ] **Step 15: Commit**

```bash
git add apps/product-service/
git commit -m "feat(product-service): add microservice with CRUD and tests"
```

---

## Task 7: Notification service — full setup

**Files:**
- Create: `apps/notification-service/package.json`
- Create: `apps/notification-service/tsconfig.json`
- Create: `apps/notification-service/nest-cli.json`
- Create: `apps/notification-service/.env`
- Create: `apps/notification-service/prisma/schema.prisma`
- Create: `apps/notification-service/src/main.ts`
- Create: `apps/notification-service/src/app.module.ts`
- Create: `apps/notification-service/src/prisma/prisma.service.ts`
- Create: `apps/notification-service/src/prisma/prisma.module.ts`
- Create: `apps/notification-service/src/notifications/notifications.service.ts`
- Create: `apps/notification-service/src/notifications/notifications.controller.ts`
- Create: `apps/notification-service/src/notifications/notifications.module.ts`

- [ ] **Step 1: Create `apps/notification-service/package.json`**

```json
{
  "name": "notification-service",
  "version": "0.0.1",
  "scripts": {
    "start:dev": "nest start --watch",
    "start": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:cov": "jest --coverage",
    "lint": "eslint \"{src}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "prisma:push": "prisma db push",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@app/contracts": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@prisma/client": "^5.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "rxjs": "^7.8.0",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@types/node": "^20.3.1",
    "prisma": "^5.0.0",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
```

- [ ] **Step 2: Create `apps/notification-service/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@app/contracts": ["../../packages/contracts/src"],
      "@app/contracts/*": ["../../packages/contracts/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/notification-service/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true, "tsConfigPath": "tsconfig.json" }
}
```

- [ ] **Step 4: Create `apps/notification-service/.env`**

```env
PORT=3003
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notifications_db
```

- [ ] **Step 5: Create `apps/notification-service/prisma/schema.prisma`**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Notification {
  id      String   @id @default(uuid())
  to      String
  subject String
  body    String
  sentAt  DateTime @default(now())
}
```

- [ ] **Step 6: Create PrismaService + PrismaModule**

`apps/notification-service/src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

`apps/notification-service/src/prisma/prisma.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

- [ ] **Step 7: Create `apps/notification-service/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: parseInt(process.env.PORT || '3003', 10) },
  });
  await app.listen();
  console.log('Notification service listening on TCP port', process.env.PORT || 3003);
}
bootstrap();
```

- [ ] **Step 8: Create `apps/notification-service/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, NotificationsModule],
})
export class AppModule {}
```

- [ ] **Step 9: Create `apps/notification-service/src/notifications/notifications.service.ts`**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from '@app/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(dto: SendNotificationDto) {
    const record = await this.prisma.notification.create({ data: dto });
    this.logger.log(`[MOCK] Sent to ${dto.to} — "${dto.subject}"`);
    return record;
  }
}
```

- [ ] **Step 10: Create `apps/notification-service/src/notifications/notifications.controller.ts`**

Note: uses `@EventPattern` (fire-and-forget — no response sent back to caller).

```typescript
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NOTIFICATION_PATTERNS, SendNotificationDto } from '@app/contracts';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern(NOTIFICATION_PATTERNS.SEND)
  send(@Payload() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }
}
```

- [ ] **Step 11: Create `apps/notification-service/src/notifications/notifications.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({ controllers: [NotificationsController], providers: [NotificationsService] })
export class NotificationsModule {}
```

- [ ] **Step 12: Commit**

```bash
git add apps/notification-service/
git commit -m "feat(notification-service): add fire-and-forget event handler"
```

---

## Task 8: Gateway — core setup

**Files:**
- Create: `apps/gateway/package.json`
- Create: `apps/gateway/tsconfig.json`
- Create: `apps/gateway/nest-cli.json`
- Create: `apps/gateway/.env`
- Create: `apps/gateway/src/main.ts`
- Create: `apps/gateway/src/app.module.ts`
- Create: `apps/gateway/src/common/interceptors/response.interceptor.ts`
- Create: `apps/gateway/src/common/filters/http-exception.filter.ts`

- [ ] **Step 1: Create `apps/gateway/package.json`**

```json
{
  "name": "gateway",
  "version": "0.0.1",
  "scripts": {
    "start:dev": "nest start --watch",
    "start": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:cov": "jest --coverage",
    "lint": "eslint \"{src}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "dependencies": {
    "@app/contracts": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/config": "^3.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "rxjs": "^7.8.0",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.2",
    "@types/node": "^20.3.1",
    "@types/passport-jwt": "^3.0.8",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@app/contracts(|/.*)$": "<rootDir>/../../packages/contracts/src$1"
    }
  }
}
```

- [ ] **Step 2: Create `apps/gateway/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@app/contracts": ["../../packages/contracts/src"],
      "@app/contracts/*": ["../../packages/contracts/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/gateway/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true, "tsConfigPath": "tsconfig.json" }
}
```

- [ ] **Step 4: Create `apps/gateway/.env`**

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

- [ ] **Step 5: Create `apps/gateway/src/common/interceptors/response.interceptor.ts`**

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => ({ success: true, statusCode: response.statusCode, data })),
    );
  }
}
```

- [ ] **Step 6: Create `apps/gateway/src/common/filters/http-exception.filter.ts`**

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    const message = typeof body === 'object' && 'message' in body ? (body as any).message : exception.message;

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

- [ ] **Step 7: Create `apps/gateway/src/app.module.ts`** (placeholder — feature modules added in Tasks 9–12)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    ProductsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Create `apps/gateway/src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('nest-micro-starter')
    .setDescription('NestJS Microservices Gateway API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Gateway running → http://localhost:${port}`);
  console.log(`Swagger docs  → http://localhost:${port}/api/docs`);
}
bootstrap();
```

- [ ] **Step 9: Commit**

```bash
git add apps/gateway/
git commit -m "feat(gateway): add core setup, Swagger, global pipes and filters"
```

---

## Task 9: Gateway — JWT auth module

**Files:**
- Create: `apps/gateway/src/auth/jwt.strategy.ts`
- Create: `apps/gateway/src/auth/jwt-auth.guard.ts`
- Create: `apps/gateway/src/auth/auth.service.ts`
- Create: `apps/gateway/src/auth/auth.service.spec.ts`
- Create: `apps/gateway/src/auth/auth.controller.ts`
- Create: `apps/gateway/src/auth/auth.module.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/gateway/src/auth/auth.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';

const mockUserClient = { send: jest.fn() };
const mockJwtService = { sign: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'USER_SERVICE', useValue: mockUserClient },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns accessToken when credentials are valid', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'Alice' };
    mockUserClient.send.mockReturnValue(of(user));
    mockJwtService.sign.mockReturnValue('jwt.token.here');
    const result = await service.login({ email: 'a@b.com', password: 'pw' });
    expect(result.accessToken).toBe('jwt.token.here');
    expect(result.user).toEqual(user);
  });

  it('throws UnauthorizedException when user-service returns null', async () => {
    mockUserClient.send.mockReturnValue(of(null));
    await expect(service.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/gateway && pnpm test -- --testPathPattern=auth.service
```

Expected: FAIL — `Cannot find module './auth.service'`

- [ ] **Step 3: Create `apps/gateway/src/auth/auth.service.ts`**

```typescript
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { USER_PATTERNS, LoginDto } from '@app/contracts';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await firstValueFrom(
      this.userClient.send(USER_PATTERNS.VALIDATE, { email: dto.email, password: dto.password }),
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
    return { accessToken, user };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/gateway && pnpm test -- --testPathPattern=auth.service
```

Expected: PASS — 2 tests passing

- [ ] **Step 5: Create `apps/gateway/src/auth/jwt.strategy.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'local_jwt_secret',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

- [ ] **Step 6: Create `apps/gateway/src/auth/jwt-auth.guard.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 7: Create `apps/gateway/src/auth/auth.controller.ts`**

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from '@app/contracts';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and get JWT' })
  @ApiResponse({ status: 200, description: 'Returns accessToken and user' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

- [ ] **Step 8: Create `apps/gateway/src/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'local_jwt_secret',
      signOptions: { expiresIn: '7d' },
    }),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.USER_SERVICE_PORT || '3001', 10),
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
```

- [ ] **Step 9: Commit**

```bash
git add apps/gateway/src/auth/
git commit -m "feat(gateway): add JWT auth module with login endpoint"
```

---

## Task 10: Gateway — Users, Products, Notifications proxy modules

**Files:**
- Create: `apps/gateway/src/users/users.service.ts`
- Create: `apps/gateway/src/users/users.controller.ts`
- Create: `apps/gateway/src/users/users.module.ts`
- Create: `apps/gateway/src/products/products.service.ts`
- Create: `apps/gateway/src/products/products.controller.ts`
- Create: `apps/gateway/src/products/products.module.ts`
- Create: `apps/gateway/src/notifications/notifications.service.ts`
- Create: `apps/gateway/src/notifications/notifications.controller.ts`
- Create: `apps/gateway/src/notifications/notifications.module.ts`

- [ ] **Step 1: Create `apps/gateway/src/users/users.service.ts`**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USER_PATTERNS, CreateUserDto, UpdateUserDto } from '@app/contracts';

@Injectable()
export class UsersService {
  constructor(@Inject('USER_SERVICE') private readonly userClient: ClientProxy) {}

  findAll() {
    return firstValueFrom(this.userClient.send(USER_PATTERNS.FIND_ALL, {}));
  }

  findOne(id: string) {
    return firstValueFrom(this.userClient.send(USER_PATTERNS.FIND_ONE, id));
  }

  create(dto: CreateUserDto) {
    return firstValueFrom(this.userClient.send(USER_PATTERNS.CREATE, dto));
  }

  update(id: string, dto: UpdateUserDto) {
    return firstValueFrom(this.userClient.send(USER_PATTERNS.UPDATE, { id, dto }));
  }

  remove(id: string) {
    return firstValueFrom(this.userClient.send(USER_PATTERNS.DELETE, id));
  }
}
```

- [ ] **Step 2: Create `apps/gateway/src/users/users.controller.ts`**

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto, UpdateUserDto } from '@app/contracts';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200 })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

- [ ] **Step 3: Create `apps/gateway/src/users/users.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.USER_SERVICE_PORT || '3001', 10),
        },
      },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 4: Create `apps/gateway/src/products/products.service.ts`**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PRODUCT_PATTERNS, CreateProductDto, UpdateProductDto } from '@app/contracts';

@Injectable()
export class ProductsService {
  constructor(@Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy) {}

  findAll() {
    return firstValueFrom(this.productClient.send(PRODUCT_PATTERNS.FIND_ALL, {}));
  }

  findOne(id: string) {
    return firstValueFrom(this.productClient.send(PRODUCT_PATTERNS.FIND_ONE, id));
  }

  create(dto: CreateProductDto, ownerId: string) {
    return firstValueFrom(this.productClient.send(PRODUCT_PATTERNS.CREATE, { ...dto, ownerId }));
  }

  update(id: string, dto: UpdateProductDto) {
    return firstValueFrom(this.productClient.send(PRODUCT_PATTERNS.UPDATE, { id, dto }));
  }

  remove(id: string) {
    return firstValueFrom(this.productClient.send(PRODUCT_PATTERNS.DELETE, id));
  }
}
```

- [ ] **Step 5: Create `apps/gateway/src/products/products.controller.ts`**

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProductDto, UpdateProductDto } from '@app/contracts';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({ status: 200 })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateProductDto, @Request() req) {
    return this.productsService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
```

- [ ] **Step 6: Create `apps/gateway/src/products/products.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PRODUCT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.PRODUCT_SERVICE_PORT || '3002', 10),
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

- [ ] **Step 7: Create `apps/gateway/src/notifications/notifications.service.ts`**

Note: uses `emit` (no response expected) — gateway fires and returns `{ queued: true }` immediately.

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_PATTERNS, SendNotificationDto } from '@app/contracts';

@Injectable()
export class NotificationsService {
  constructor(@Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy) {}

  send(dto: SendNotificationDto) {
    this.notificationClient.emit(NOTIFICATION_PATTERNS.SEND, dto);
    return { queued: true };
  }
}
```

- [ ] **Step 8: Create `apps/gateway/src/notifications/notifications.controller.ts`**

```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendNotificationDto } from '@app/contracts';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send notification (fire-and-forget)' })
  @ApiResponse({ status: 200, description: '{ queued: true }' })
  send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }
}
```

- [ ] **Step 9: Create `apps/gateway/src/notifications/notifications.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3003', 10),
        },
      },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
```

- [ ] **Step 10: Commit**

```bash
git add apps/gateway/src/
git commit -m "feat(gateway): add users, products, notifications proxy modules"
```

---

## Task 11: README + install verification

**Files:**
- Create: `README.md`

- [ ] **Step 1: Install all workspace dependencies**

```bash
pnpm install
```

Expected: workspace links created, all packages resolved

- [ ] **Step 2: Start Docker and push Prisma schemas**

```bash
docker-compose up -d
# wait ~5s for postgres to be ready
pnpm run prisma:generate
pnpm run prisma:push
```

Expected: `users_db`, `products_db`, `notifications_db` schemas applied, Prisma clients generated

- [ ] **Step 3: Run all tests**

```bash
pnpm run test
```

Expected: all spec files pass (UsersService: 4 tests, ProductsService: 2 tests, AuthService: 2 tests)

- [ ] **Step 4: Start all services**

```bash
pnpm run dev
```

Expected: 4 processes start — gateway on 3000, services on 3001/3002/3003

- [ ] **Step 5: Verify Swagger loads**

Open `http://localhost:3000/api/docs` — confirm all 4 tag groups (Auth, Users, Products, Notifications) are present with their routes.

- [ ] **Step 6: Create `README.md`**

```markdown
# nest-micro-starter

A production-ready NestJS microservices starter using pnpm workspaces and TCP transport. Clone, rename, build.

## Stack

- **Framework:** NestJS 10
- **Transport:** TCP (built-in, zero dependencies)
- **Database:** PostgreSQL 16 + Prisma 5 (one DB per service)
- **Auth:** JWT (validated at gateway, trusted by services)
- **Docs:** Swagger at `/api/docs`
- **Workspace:** pnpm workspaces

## Services

| Service | Transport | Port | Role |
|---------|-----------|------|------|
| gateway | HTTP | 3000 | Entry point, JWT auth, Swagger |
| user-service | TCP | 3001 | User CRUD + password validation |
| product-service | TCP | 3002 | Product CRUD |
| notification-service | TCP | 3003 | Async events (mock send) |

## Quick Start

**Prerequisites:** Node.js 18+, pnpm 8+, Docker

```bash
git clone https://github.com/Muhammad-Tayyab1/nest-micro-starter.git my-project
cd my-project
pnpm install

# Create .env files for each app (see .env.example)
cp .env.example apps/gateway/.env
# Edit apps/user-service/.env, apps/product-service/.env, apps/notification-service/.env
# with PORT and DATABASE_URL only (see .env.example comments)

docker-compose up -d
pnpm run prisma:push
pnpm run dev
```

Open [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## How It Works

```
Client → Gateway (HTTP:3000)
           ├─ POST /auth/login       → user-service (TCP:3001) — validate + issue JWT
           ├─ GET/POST/PATCH/DELETE /users      → user-service (TCP:3001)
           ├─ GET/POST/PATCH/DELETE /products   → product-service (TCP:3002)
           └─ POST /notifications/send          → notification-service (TCP:3003, fire-and-forget)
```

- Gateway validates JWT on all routes except `POST /auth/login` and `POST /users`
- Services communicate only via TCP — no HTTP server in services
- `packages/contracts` holds all shared DTOs and message pattern constants

## Project Structure

```
nest-micro-starter/
├── apps/
│   ├── gateway/              # HTTP + JWT + Swagger
│   ├── user-service/         # User CRUD + bcrypt
│   ├── product-service/      # Product CRUD
│   └── notification-service/ # Fire-and-forget events
├── packages/
│   └── contracts/            # @app/contracts — DTOs + message patterns
├── docker/init.sql           # Creates 3 databases
├── docker-compose.yml
└── .env.example
```

## Adding a New Service

1. Copy `apps/product-service/` → `apps/your-service/`
2. Update `name`, `PORT`, `DATABASE_URL` in `package.json` and `.env`
3. Write your Prisma schema + run `prisma:push` + `prisma:generate`
4. Add message patterns to `packages/contracts/src/patterns.ts` + export from `index.ts`
5. Register TCP client in the relevant gateway module
6. Add gateway controller + service + module

## Running Tests

```bash
pnpm run test          # all services
pnpm run test:cov      # with coverage
```

## License

MIT
```

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: add README with quick start and architecture overview"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ pnpm workspaces with `apps/` and `packages/`
- ✅ gateway (HTTP:3000), user-service (TCP:3001), product-service (TCP:3002), notification-service (TCP:3003)
- ✅ `@app/contracts` shared package with patterns + DTOs
- ✅ Docker Compose + `docker/init.sql` creating 3 databases
- ✅ Prisma per service with local credentials
- ✅ JWT validation at gateway, `USER_PATTERNS.VALIDATE` for login
- ✅ All endpoints: Auth, Users, Products, Notifications
- ✅ Fire-and-forget via `emit` + `@EventPattern` for notifications
- ✅ Swagger at `/api/docs` with Bearer auth
- ✅ `ResponseInterceptor` and `HttpExceptionFilter` on gateway
- ✅ `.env.example` documenting all vars
- ✅ README with quick start

**No placeholders, no TBDs, no "similar to task N" references.**

**Type consistency:**
- `USER_PATTERNS`, `PRODUCT_PATTERNS`, `NOTIFICATION_PATTERNS` defined in Task 2, used consistently in Tasks 5, 6, 7, 9, 10
- `CreateUserDto`, `UpdateUserDto`, `CreateProductDto`, `UpdateProductDto`, `SendNotificationDto`, `LoginDto` defined in Task 2 contracts, imported identically across all tasks
- `USER_SERVICE`, `PRODUCT_SERVICE`, `NOTIFICATION_SERVICE` injection tokens used consistently in gateway modules
- `mockPrisma.user.*` in user-service spec matches `this.prisma.user.*` in UsersService
- `mockPrisma.product.*` in product-service spec matches `this.prisma.product.*` in ProductsService
