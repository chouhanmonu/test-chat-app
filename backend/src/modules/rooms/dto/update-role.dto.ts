import { IsEnum, IsMongoId } from 'class-validator';

export class UpdateRoleDto {
  @IsMongoId()
  userId: string;

  @IsEnum(['admin', 'member'])
  role: 'admin' | 'member';
}
