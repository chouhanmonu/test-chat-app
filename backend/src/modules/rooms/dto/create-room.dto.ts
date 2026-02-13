import { IsArray, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MemberKeyDto {
  @IsString()
  deviceId: string;

  @IsString()
  key: string;
}

class MemberDto {
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

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(['dm', 'group'])
  type: 'dm' | 'group';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberDto)
  members: MemberDto[];
}
