import { IsEnum, IsMongoId, IsOptional } from 'class-validator';

export class AddMemberDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsEnum(['admin', 'member'])
  role?: 'admin' | 'member';
}
