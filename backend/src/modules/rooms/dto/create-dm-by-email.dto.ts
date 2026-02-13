import { IsEmail } from 'class-validator';

export class CreateDmByEmailDto {
  @IsEmail()
  email: string;
}
