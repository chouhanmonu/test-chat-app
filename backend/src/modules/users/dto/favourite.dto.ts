import { IsMongoId } from 'class-validator';

export class FavouriteDto {
  @IsMongoId()
  userId: string;
}
