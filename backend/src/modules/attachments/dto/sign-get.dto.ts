import { IsMongoId } from 'class-validator';

export class SignGetDto {
  @IsMongoId()
  attachmentId: string;
}
