import { IsArray, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MemberKeyDto {
  @IsString()
  deviceId: string;

  @IsString()
  key: string;
}

export class AddMemberDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsEnum(['admin', 'member'])
  role?: 'admin' | 'member';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberKeyDto)
  encryptedSecretKeys?: MemberKeyDto[];
}
