import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;

  @IsOptional()
  @IsEmail()
  alternateEmail?: string;

  @IsOptional()
  @IsString()
  mobile?: string;
}
