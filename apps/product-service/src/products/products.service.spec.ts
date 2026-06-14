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
