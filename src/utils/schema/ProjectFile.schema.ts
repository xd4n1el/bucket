import { ApiProperty } from '@nestjs/swagger';
import { ProjectFile } from '@utils/interfaces';
import { ResponseDto } from './Response.schema';

class Data implements ProjectFile {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  projectID: string;

  @ApiProperty()
  url: string;
}

export class ProjectFileDto extends ResponseDto {
  @ApiProperty()
  data: Data;
}
