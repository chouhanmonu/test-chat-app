import { IsArray, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AttachmentDto {
  @IsString()
  mimeType: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsString()
  fileName: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  size?: number;
}

export class SendMessageDto {
  @IsMongoId()
  roomId: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  encryptedContent?: string;

  @IsOptional()
  @IsString()
  encryptionMetadata?: string;

  @IsOptional()
  @IsMongoId()
  replyingToMessageId?: string;

  @IsOptional()
  @IsMongoId()
  forwardedFromMessageId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
