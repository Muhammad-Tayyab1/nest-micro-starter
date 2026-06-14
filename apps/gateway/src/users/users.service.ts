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
