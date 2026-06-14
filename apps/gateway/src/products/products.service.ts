import { Injectable, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';
import { PRODUCT_PATTERNS, CreateProductDto, UpdateProductDto } from '@app/contracts';

@Injectable()
export class ProductsService {
  constructor(@Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy) {}

  findAll() {
    return firstValueFrom(
      this.productClient.send(PRODUCT_PATTERNS.FIND_ALL, {}).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('Product service unavailable'))),
      ),
    );
  }

  findOne(id: string) {
    return firstValueFrom(
      this.productClient.send(PRODUCT_PATTERNS.FIND_ONE, id).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('Product service unavailable'))),
      ),
    );
  }

  create(dto: CreateProductDto, ownerId: string) {
    return firstValueFrom(
      this.productClient.send(PRODUCT_PATTERNS.CREATE, { ...dto, ownerId }).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('Product service unavailable'))),
      ),
    );
  }

  update(id: string, dto: UpdateProductDto) {
    return firstValueFrom(
      this.productClient.send(PRODUCT_PATTERNS.UPDATE, { id, dto }).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('Product service unavailable'))),
      ),
    );
  }

  remove(id: string) {
    return firstValueFrom(
      this.productClient.send(PRODUCT_PATTERNS.DELETE, id).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('Product service unavailable'))),
      ),
    );
  }
}
