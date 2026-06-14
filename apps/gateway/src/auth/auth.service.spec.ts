import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';

const mockUserClient = { send: jest.fn() };
const mockJwtService = { sign: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'USER_SERVICE', useValue: mockUserClient },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns accessToken when credentials are valid', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'Alice' };
    mockUserClient.send.mockReturnValue(of(user));
    mockJwtService.sign.mockReturnValue('jwt.token.here');
    const result = await service.login({ email: 'a@b.com', password: 'pw' });
    expect(result.accessToken).toBe('jwt.token.here');
    expect(result.user).toEqual(user);
  });

  it('throws UnauthorizedException when user-service returns null', async () => {
    mockUserClient.send.mockReturnValue(of(null));
    await expect(service.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
  });
});
