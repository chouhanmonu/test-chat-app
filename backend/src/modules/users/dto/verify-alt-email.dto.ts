import { IsEmail } from 'class-validator';

export class VerifyAltEmailDto {
  @IsEmail()
  alternateEmail: string;
}
