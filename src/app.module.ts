import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';

import { FilesModule } from '@files/files.module';
import { ProjectsModule } from '@projects/projects.module';

import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'src', 'resources'),
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env', cache: true }),
    FilesModule,
    ProjectsModule,
  ],
})
export class AppModule {}
