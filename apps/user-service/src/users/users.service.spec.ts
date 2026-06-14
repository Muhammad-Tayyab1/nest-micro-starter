import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@app/contracts';
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
