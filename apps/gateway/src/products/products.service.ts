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
