import { Injectable, Inject, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';
import { USER_PATTERNS, LoginDto } from '@app/contracts';

@Injectable()
export class AuthService {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await firstValueFrom(
      this.userClient.send(USER_PATTERNS.VALIDATE, { email: dto.email, password: dto.password }).pipe(
        timeout(5000),
        catchError(() => throwError(() => new ServiceUnavailableException('User service unavailable'))),
      ),
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });
    return { accessToken, user };
  }
}
