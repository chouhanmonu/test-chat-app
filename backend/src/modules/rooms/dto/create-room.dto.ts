import { IsArray, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MemberDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsEnum(['admin', 'member'])
  role?: 'admin' | 'member';
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
