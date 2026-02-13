import { IsArray, IsMongoId, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DeviceKeyDto {
  @IsString()
  deviceId: string;

  @IsString()
  key: string;
}

class MemberKeysDto {
  @IsMongoId()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceKeyDto)
  keys: DeviceKeyDto[];
}

export class UpdateRoomKeysDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MemberKeysDto)
  memberKeys: MemberKeysDto[];
}
