import { HttpStatus, Injectable } from '@nestjs/common';

import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';

import { FilesService } from '@files/files.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import Messenger from '@utils/messenger';
import { response } from '@utils/functions';
import { HTTPResponse, Project } from '@utils/interfaces';

interface Options {
  comparator: keyof Project;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly filesService: FilesService) {
    this.updateProjects();
  }

  private projects: Project[] = [];
  private readonly messenger = new Messenger();
  private readonly resources = path.resolve('src', 'resources');
  private readonly store = path.resolve('src', 'store', 'projects.json');

  private getKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  private updateProjects() {
    this.projects =
      this.filesService.readFile<Project[]>(this.store, true) || [];
  }

  private compare(oldValue: string, newValue: string): string {
    if (newValue && newValue !== oldValue) return newValue;

    return oldValue;
  }

  private checkValue(value: any, comparator: keyof Project) {
    return this.projects?.some(project => project[comparator] === value);
  }

  private getUniqueValue<T = any>(
    createValue: () => T,
    { comparator }: Options,
  ): T {
    let value = createValue();

    // Verifica se o valor gerado já existe
    let exists = this.checkValue(value, comparator);

    // Gera um novo valor enquanto o valor gerado já existir
    while (exists) {
      value = createValue();

      exists = this.checkValue(value, comparator);
    }

    return value;
  }

  private formatStore() {
    const data = JSON.stringify(this.projects, null, 2);

    return data;
  }

  private async updateStore() {
    await this.filesService.createFile(this.store, this.formatStore());
  }

  async create({ projectName }: CreateProjectDto) {
    try {
      this.updateProjects();

      const id = this.getUniqueValue(uuid, { comparator: 'id' });
      const public_key = this.getUniqueValue(this.getKey, {
        comparator: 'public_key',
      });
      const private_key = this.getUniqueValue(this.getKey, {
        comparator: 'private_key',
      });
      const folder = id;

      const project: Project = {
        id,
        folder: id,
        project: projectName,
        createdAt: new Date(),
        public_key: public_key,
        private_key: private_key,
      };

      this.projects.push(project);

      if (!this.filesService.exists(this.resources)) {
        this.filesService.createFolder(this.resources);
      }

      const project_store = path.join(this.resources, folder);

      await this.updateStore();
      await this.filesService.createFolder(project_store);
      await this.filesService.updateSourcemap(id, []);

      delete project.folder;

      this.updateProjects();

      return response<Project>({
        data: project,
        status: HttpStatus.CREATED,
        message: this.messenger.create('project'),
      });
    } catch ({ message }: any) {
      switch (message) {
        case 'project-conflict':
          return response({
            error: true,
            status: HttpStatus.BAD_REQUEST,
            message: this.messenger.conflict('project'),
          });
        default:
          return response({
            error: true,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: this.messenger.create('project', true),
          });
      }
    }
  }

  async findAll(): Promise<HTTPResponse<Project[]>> {
    try {
      this.updateProjects();

      if (!this.projects || this.projects.length === 0) {
        throw new Error('no-projects-found');
      }

      return response<Project[]>({ data: this.projects });
    } catch ({ message }: any) {
      switch (message) {
        case 'no-projects-found':
          return response({
            error: true,
            status: HttpStatus.NO_CONTENT,
            message: this.messenger.empty('projects'),
          });
        default:
          return response({
            error: true,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: this.messenger.create('project', true),
          });
      }
    }
  }

  findOne(id: string): HTTPResponse<Project> {
    try {
      this.updateProjects();

      const project = this.projects.find(
        ({ id: projectID }) => projectID === id,
      );

      if (!project) throw new Error('not-found');

      return response({ data: project, status: HttpStatus.OK });
    } catch ({ message }: any) {
      switch (message) {
        case 'not-found':
          return response({
            error: true,
            status: HttpStatus.NOT_FOUND,
            message: this.messenger.empty('project'),
          });
        default:
          return response({
            error: true,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: this.messenger.internal(),
          });
      }
    }
  }

  async update(
    id: string,
    { projectName, newPrivateKey, newPublicKey }: UpdateProjectDto,
  ): Promise<HTTPResponse<Project>> {
    try {
      this.updateProjects();

      const index = this.projects.findIndex(
        ({ id: projectID }) => projectID === id,
      );

      if (index === -1) throw new Error('no-project-found');

      let project = this.projects[index];

      const updates: Partial<Project> = {
        project: this.compare(project?.project, projectName),
      };

      if (newPrivateKey) {
        updates.private_key = this.getUniqueValue(this.getKey, {
          comparator: 'private_key',
        });
      }

      if (newPublicKey) {
        updates.public_key = this.getUniqueValue(this.getKey, {
          comparator: 'public_key',
        });
      }

      project = { ...project, ...updates };

      this.projects[index] = project;

      await this.updateStore();
      this.updateProjects();

      return response({ status: HttpStatus.OK, data: project });
    } catch ({ message }: any) {
      switch (message) {
        case 'no-project-found':
          return response({
            error: true,
            status: HttpStatus.NOT_FOUND,
            message: this.messenger.notfound('project'),
          });
        default:
          return response({
            error: true,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: this.messenger.internal(),
          });
      }
    }
  }

  async remove(id: string): Promise<HTTPResponse> {
    try {
      this.updateProjects();

      const project = this.projects.find(
        ({ id: projectID }) => projectID === id,
      );

      if (!project) throw new Error('no-project-found');

      this.projects = this.projects.filter(
        ({ id: projectID }) => projectID !== id,
      );

      const resourcesPath = path.join(this.resources, id);

      await this.updateStore();
      await this.filesService.deleteFolder(resourcesPath);

      return response({
        status: HttpStatus.OK,
        message: this.messenger.remove('project'),
      });
    } catch ({ message }: any) {
      switch (message) {
        case 'no-project-found':
          return response({
            error: true,
            status: HttpStatus.NOT_FOUND,
            message: this.messenger.notfound('project'),
          });
        default:
          return response({
            error: true,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: this.messenger.internal(),
          });
      }
    }
  }
}
