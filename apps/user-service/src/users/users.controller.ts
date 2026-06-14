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
