import { IsNotEmpty, IsString } from 'class-validator';

export class SignGetDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
