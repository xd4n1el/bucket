import { ApiProperty } from '@nestjs/swagger';
import { IsValidPath } from '@utils/validators';
import { IsOptional, IsString } from 'class-validator';

export class CreateFileDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsValidPath({ message: 'path field is not a valid path url.' })
  path: string;

  @ApiProperty()
  @IsOptional()
  isPrivate: boolean;
}
