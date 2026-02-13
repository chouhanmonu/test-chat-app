import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TokenService } from '../tokens/token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { AccountCleanupService } from './account-cleanup.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
    private readonly cleanupService: AccountCleanupService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      isEmailVerified: false,
      devices: [
        {
          deviceId: dto.deviceId,
          deviceName: dto.deviceName,
          publicKey: dto.publicKey,
          registeredAt: new Date(),
          lastSeenAt: new Date(),
          isActive: true
        }
      ]
    });

    return this.issueTokens(user._id.toString(), user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.usersService.addDevice(user._id.toString(), {
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      publicKey: dto.publicKey,
      registeredAt: new Date(),
      lastSeenAt: new Date(),
      isActive: true
    });

    return this.issueTokens(user._id.toString(), user.email);
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid token');

    const stored = await this.tokenService.getRefreshToken(userId);
    if (!stored || stored !== refreshToken) throw new UnauthorizedException('Invalid token');

    return this.issueTokens(user._id.toString(), user.email);
  }

  async changeEmail(userId: string, dto: ChangeEmailDto) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    user.email = dto.newEmail.toLowerCase();
    user.isEmailVerified = false;
    await user.save();
    return { success: true };
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.cleanupService.cleanupUser(userId);
    await this.usersService.deleteAccount(userId);
    await this.tokenService.revokeRefreshToken(userId);
    return { success: true };
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(payload),
      this.tokenService.signRefreshToken(payload)
    ]);

    await this.tokenService.storeRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('jwtAccessTtl')
    };
  }
}
