import { IsNotEmpty, IsString } from 'class-validator';

export class PresignDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;
}
