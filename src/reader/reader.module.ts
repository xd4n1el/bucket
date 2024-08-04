import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

import { join } from 'path';

import { ReaderController } from '@reader/reader.controller';

import { ReaderService } from '@reader/reader.service';
import { FilesService } from '@files/files.service';
import { ProjectsService } from '@projects/projects.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'src', 'resources'),
    }),
  ],
  controllers: [ReaderController],
  providers: [ReaderService, FilesService, ProjectsService],
})
export class ReaderModule {}
