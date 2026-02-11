import { IsMongoId } from 'class-validator';

export class UpdateStatusDto {
  @IsMongoId()
  roomId: string;

  @IsMongoId()
  messageId: string;
}
