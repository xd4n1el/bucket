import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { PrivateKeyGuard } from '@guards/private-key.guard';
import { UUIDValidationPipe } from '@pipes/uuid-validation.pipe';

import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { CreateSignedURLDto } from './dto/create-signed-url.dto';

import { ProjectRequest } from '@utils/interfaces';
import { ProjectFileDto, ResponseDto, SignedURLDto } from '@utils/schema';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('/signed/:id')
  @UseGuards(PrivateKeyGuard)
  @ApiExtraModels(SignedURLDto, ResponseDto)
  @ApiOperation({
    description:
      'Should be called when you need an external access on a private file.',
  })
  @ApiHeader({
    name: 'x-private-key',
    description: 'Access Key',
    required: true,
  })
  @ApiCreatedResponse({
    schema: { $ref: getSchemaPath(SignedURLDto) },
  })
  @ApiBadRequestResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Invalid body provided or file is already with public field.',
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Project have no files.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  async createSignedURL(
    @Req() { project }: ProjectRequest,
    @Res() res: Response,
    @Body() createSignedURLDto: CreateSignedURLDto,
    @Param('id', UUIDValidationPipe) id: string,
  ) {
    const { status, ...rest } = await this.filesService.createSignedURL(
      id,
      project,
      createSignedURLDto,
    );

    return res.status(status).send(rest);
  }

  @Post()
  @ApiHeader({
    name: 'x-private-key',
    description: 'Access Key',
    required: true,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    required: true,
    type: CreateFileDto,
    schema: {
      additionalProperties: {
        properties: {
          path: { type: 'string' },
          file: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiExtraModels(ProjectFileDto, ResponseDto)
  @UseGuards(PrivateKeyGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiCreatedResponse({ schema: { $ref: getSchemaPath(ProjectFileDto) } })
  @ApiBadRequestResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Invalid body field provided.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  async create(
    @Req() { project }: ProjectRequest,
    @Res() res: Response,
    @Body() createFileDto: CreateFileDto,
    @UploadedFile('file') file: Express.Multer.File,
  ) {
    const { status, ...rest } = await this.filesService.create(
      createFileDto,
      file,
      project,
    );

    res.status(status).send(rest);
  }

  @Get(':id')
  @UseGuards(PrivateKeyGuard)
  @ApiHeader({
    name: 'x-private-key',
    description: 'Access Key',
    required: true,
  })
  @ApiProduces('application/pdf', 'image/*')
  @ApiOkResponse({
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'File not found.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  async findOne(
    @Req() { project }: ProjectRequest,
    @Res() res: Response,
    @Param('id', UUIDValidationPipe) id: string,
  ) {
    const { status, data, ...rest } = await this.filesService.findOne(
      id,
      project,
    );

    res.status(status);

    if (data) {
      const { stream, name, content } = data || {};

      res.set({
        'Content-Type': content,
        'Content-Disposition': `attachment; filename="${name}"`,
      });

      return stream.pipe(res);
    }

    return res.send(rest);
  }

  @Delete('/directory/:path')
  @UseGuards(PrivateKeyGuard)
  @ApiHeader({
    name: 'x-private-key',
    description: 'Access Key',
    required: true,
  })
  @ApiParam({
    name: 'path',
    description: 'the path to the target directory, use "," instead of "/"',
  })
  @ApiOkResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Directory deleted successfully.',
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Directory not found.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  async removeDir(
    @Req() { project }: ProjectRequest,
    @Res() res: Response,
    @Param('path') path: string,
  ) {
    const { status, ...rest } = await this.filesService.removeDir(
      path,
      project,
    );

    res.status(status).send(rest);
  }

  @Delete(':id')
  @UseGuards(PrivateKeyGuard)
  @ApiHeader({
    name: 'x-private-key',
    description: 'Access Key',
    required: true,
  })
  @ApiOkResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'File deleted successfully.',
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'File not found.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  async remove(
    @Req() { project }: ProjectRequest,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const { status, ...rest } = await this.filesService.remove(id, project);

    res.status(status).send(rest);
  }
}
