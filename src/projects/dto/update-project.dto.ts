import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsOptional } from 'class-validator';

import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends CreateProjectDto {
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  newPublicKey: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  newPrivateKey: boolean;
}
