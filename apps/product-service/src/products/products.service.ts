import { Injectable } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from '@app/contracts';
import { PrismaService } from '@app/contracts';

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
