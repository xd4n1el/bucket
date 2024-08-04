import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReadFileQueryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  access: string;
}
