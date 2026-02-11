import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class SearchMessageDto {
  @IsMongoId()
  roomId: string;

  @IsOptional()
  @IsString()
  query?: string;
}
