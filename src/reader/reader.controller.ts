import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';

import { UUIDValidationPipe } from '@pipes/uuid-validation.pipe';

import { ReaderService } from '@reader/reader.service';

import { ProjectRequest } from '@utils/interfaces';
import { PublicKeyGuard } from '@guards/public-key.guard';
import { ReadFileQueryDto } from './dto/read-file.dto';

@Controller()
export class ReaderController {
  constructor(private readonly readerService: ReaderService) {}

  @Get(':id')
  @UseGuards(PublicKeyGuard)
  async findOne(
    @Req() { project }: ProjectRequest,
    @Res() res: Response,
    @Param('id', UUIDValidationPipe) id: string,
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidNonWhitelisted: true,
      }),
    )
    query: ReadFileQueryDto,
  ) {
    const {
      status,
      data: stream,
      ...rest
    } = await this.readerService.findOne(id, project, query);

    res.status(status);

    if (stream) {
      return stream?.pipe(res);
    }

    return res.send(rest);
  }
}
