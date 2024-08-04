import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSignedURLDto {
  @ApiProperty({ description: 'Expiration in seconds.' })
  @IsNumber()
  @IsInt()
  @IsNotEmpty()
  expiration: number;
}
