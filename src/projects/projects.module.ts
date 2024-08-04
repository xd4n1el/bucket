import { Module } from '@nestjs/common';

import { FilesService } from '@files/files.service';
import { ProjectsService } from '@projects/projects.service';

import { ProjectsController } from '@projects/projects.controller';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, FilesService],
})
export class ProjectsModule {}
