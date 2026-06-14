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
