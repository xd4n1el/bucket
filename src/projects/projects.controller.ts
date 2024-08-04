import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

import { AdminGuard } from '@guards/admin.guard';
import { UUIDValidationPipe } from '@pipes/uuid-validation.pipe';

import { ProjectsService } from './projects.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import { ProjectDto, ResponseDto } from '@utils/schema';

@ApiTags('/Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Access Key',
    required: true,
  })
  @ApiExtraModels(ProjectDto, ResponseDto)
  @ApiCreatedResponse({ schema: { $ref: getSchemaPath(ProjectDto) } })
  @ApiBadRequestResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Invalid body field provided.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  async create(
    @Body() createManagerDto: CreateProjectDto,
    @Res() res: Response,
  ) {
    const { status, ...rest } =
      await this.projectsService.create(createManagerDto);

    res.status(status).send(rest);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Access Key',
    required: true,
  })
  @ApiOkResponse({
    schema: { items: { $ref: getSchemaPath(ProjectDto) } },
    isArray: true,
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'No projects found.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Access Key',
    required: true,
  })
  @ApiOkResponse({ schema: { $ref: getSchemaPath(ProjectDto) } })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Project not found.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  async findOne(
    @Param('id', UUIDValidationPipe) id: string,
    @Res() res: Response,
  ) {
    const { status, ...rest } = this.projectsService.findOne(id);

    res.status(status).send(rest);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Access Key',
    required: true,
  })
  @ApiOkResponse({ schema: { $ref: getSchemaPath(ProjectDto) } })
  @ApiBadRequestResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Invalid body field provided.',
  })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'No projects found.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  async update(
    @Res() res: Response,
    @Body() updateManagerDto: UpdateProjectDto,
    @Param('id', UUIDValidationPipe) id: string,
  ) {
    const { status, ...rest } = await this.projectsService.update(
      id,
      updateManagerDto,
    );

    res.status(status).send(rest);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiHeader({
    name: 'x-admin-key',
    description: 'Access Key',
    required: true,
  })
  @ApiOkResponse({ schema: { $ref: getSchemaPath(ProjectDto) } })
  @ApiNotFoundResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Project not found.',
  })
  @ApiInternalServerErrorResponse({
    schema: { $ref: getSchemaPath(ResponseDto) },
    description: 'Some application internal error.',
  })
  async remove(
    @Param('id', UUIDValidationPipe) id: string,
    @Res() res: Response,
  ) {
    const { status, ...rest } = await this.projectsService.remove(id);

    res.status(status).send(rest);
  }
}
