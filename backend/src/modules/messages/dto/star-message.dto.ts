import { IsMongoId } from 'class-validator';

export class StarMessageDto {
  @IsMongoId()
  messageId: string;
}
