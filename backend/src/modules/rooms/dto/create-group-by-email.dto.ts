import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateGroupByEmailDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  @IsEmail({}, { each: true })
  emails: string[];
}
