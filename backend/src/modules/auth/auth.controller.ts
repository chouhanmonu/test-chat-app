import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  refresh(@CurrentUser() user: any, @Body() dto: RefreshDto) {
    return this.authService.refresh(user.sub, dto.refreshToken);
  }

  @Post('change-email')
  @UseGuards(JwtAuthGuard)
  changeEmail(@CurrentUser() user: any, @Body() dto: ChangeEmailDto) {
    return this.authService.changeEmail(user.sub, dto);
  }

  @Post('delete-account')
  @UseGuards(JwtAuthGuard)
  deleteAccount(@CurrentUser() user: any, @Body() dto: DeleteAccountDto) {
    return this.authService.deleteAccount(user.sub, dto);
  }
}
