import { ApiProperty } from '@nestjs/swagger';
import { HTTPResponse } from '@utils/interfaces';

export class ResponseDto implements HTTPResponse {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}
