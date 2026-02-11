import { Test } from '@nestjs/testing';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersService } from '../src/modules/users/users.service';
import { TokenService } from '../src/modules/tokens/token.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let tokenService: TokenService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            addDevice: jest.fn(),
            createUser: jest.fn(),
            findById: jest.fn()
          }
        },
        {
          provide: TokenService,
          useValue: {
            signAccessToken: jest.fn().mockResolvedValue('access'),
            signRefreshToken: jest.fn().mockResolvedValue('refresh'),
            storeRefreshToken: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('900s')
          }
        }
      ]
    }).compile();

    authService = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
    tokenService = moduleRef.get(TokenService);
  });

  it('logs in and returns tokens', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      _id: 'user1',
      email: 'test@example.com',
      passwordHash: 'hash'
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123',
      deviceId: 'device1',
      publicKey: 'pk',
      deviceName: 'laptop'
    });

    expect(result.accessToken).toBe('access');
    expect(result.refreshToken).toBe('refresh');
    expect(tokenService.storeRefreshToken).toHaveBeenCalled();
  });
});
