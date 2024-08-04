import { ApiProperty } from '@nestjs/swagger';
import { Project } from '@utils/interfaces';
import { ResponseDto } from './Response.schema';

class Data implements Project {
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  folder: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  project: string;

  @ApiProperty()
  private_key: string;

  @ApiProperty()
  public_key: string;
}

export class ProjectDto extends ResponseDto {
  @ApiProperty()
  data: Data;
}
