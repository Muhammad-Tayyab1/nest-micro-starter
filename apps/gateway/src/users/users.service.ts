import { Injectable, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';
import { USER_PATTERNS, CreateUserDto, UpdateUserDto } from '@app/contracts';

@Injectable()
export class UsersService {
  constructor(@Inject('USER_SERVICE') private readonly userClient: ClientProxy) {}

  findAll() {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.FIND_ALL, {}).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('User service unavailable'))),
      ),
    );
  }

  findOne(id: string) {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.FIND_ONE, id).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('User service unavailable'))),
      ),
    );
  }

  create(dto: CreateUserDto) {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.CREATE, dto).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('User service unavailable'))),
      ),
    );
  }

  update(id: string, dto: UpdateUserDto) {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.UPDATE, { id, dto }).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('User service unavailable'))),
      ),
    );
  }

  remove(id: string) {
    return firstValueFrom(
      this.userClient.send(USER_PATTERNS.DELETE, id).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('User service unavailable'))),
      ),
    );
  }
}
