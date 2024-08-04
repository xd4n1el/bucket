import { ApiProperty } from '@nestjs/swagger';

import { ResponseDto } from './Response.schema';

import { SignedURL } from '@utils/interfaces';

class Data implements Omit<SignedURL, 'createdAt' | 'expiresAt'> {
  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  url: string;
}

export class SignedURLDto extends ResponseDto {
  @ApiProperty()
  data: Data;
}
