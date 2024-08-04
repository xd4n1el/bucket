import { FilesService } from '@files/files.service';
import { HttpStatus, Injectable } from '@nestjs/common';

import { ReadStream } from 'fs';

import Messenger from '@utils/messenger';
import { response } from '@utils/functions';
import { HTTPResponse, Project } from '@utils/interfaces';
import { ReadFileQueryDto } from './dto/read-file.dto';

@Injectable()
export class ReaderService {
  private readonly messenger = new Messenger();

  constructor(private readonly filesService: FilesService) {}

  async findOne(
    id: string,
    { id: projectID }: Partial<Project> = {},
    { access }: Partial<ReadFileQueryDto> = {},
  ): Promise<HTTPResponse<ReadStream>> {
    try {
      const { success, data } = await this.filesService.findOne(id, {
        id: projectID,
      });

      if (!success) throw new Error();

      const { stream, sourcemap } = data || {};

      const { isPrivate } = sourcemap;

      if (isPrivate) {
        if (!access) throw new Error('no-access-token-provided');

        const { isValid } = this.filesService.validateSignedURLS(
          sourcemap,
          access,
        );

        if (!isValid) throw new Error('no-access-token-provided');
      }

      return response({ status: HttpStatus.OK, data: stream });
    } catch ({ message }: any) {
      return response({
        error: true,
        status: HttpStatus.NOT_FOUND,
        message: this.messenger.notfound('file'),
      });
    }
  }
}
