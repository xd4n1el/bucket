import { Module } from '@nestjs/common';

import { FilesController } from './files.controller';

import { FilesService } from './files.service';
import { ProjectsService } from '@projects/projects.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, ProjectsService],
})
export class FilesModule {}
