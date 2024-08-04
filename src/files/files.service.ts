import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { lookup } from 'mime-types';

import { CreateFileDto } from './dto/create-file.dto';
import { CreateSignedURLDto } from './dto/create-signed-url.dto';

import Messenger from '@utils/messenger';
import { response } from '@utils/functions';
import {
  BaseResponse,
  HTTPResponse,
  Project,
  ProjectFile,
  SignedURL,
  SourceMap,
} from '@utils/interfaces';
import { isAfter } from 'date-fns';

interface ReadOptions {
  file: File;
  path: string;
  name: string;
  content: string | false;
  stream: fs.ReadStream;
  sourcemap: SourceMap;
}

@Injectable()
export class FilesService {
  private readonly maxExpiration = 604800;
  private readonly domain = process.env.DOMAIN;
  private readonly messenger = new Messenger();
  private readonly logger = new Logger(FilesService?.name);
  private readonly root = path.resolve('src', 'resources');

  private getURL(fileID: string, signed?: boolean) {
    const url = new URL(fileID, this.domain);

    let token: string | undefined;

    if (signed) {
      token = crypto.randomBytes(16).toString('hex');

      url.searchParams.append('access', token);
    }

    return { url: url?.toString(), token };
  }

  private validateExpiredURLs(urls: SignedURL[] = []) {
    return urls?.filter(({ expiresAt }) =>
      isAfter(new Date(expiresAt), new Date()),
    );
  }

  private resolveSourcemaps(projectID: string) {
    const dir = path.resolve('src', 'resources', projectID, 'sourcemap.json');

    return dir;
  }

  private getProjectSourcemaps = (projectID: string): SourceMap[] => {
    try {
      const sourcemaps = this.resolveSourcemaps(projectID);

      if (!this.exists(sourcemaps)) throw new Error();

      return this.readFile<SourceMap[]>(sourcemaps, true) || [];
    } catch {
      return [];
    }
  };

  private formatSourcemap(sourcemaps: SourceMap[] = []) {
    const data = JSON.stringify(sourcemaps, null, 2);

    return data;
  }

  validateSignedURLS(sourcemap: SourceMap, signedToken?: string) {
    let isValid: boolean = false;
    const { signedURLs } = sourcemap;

    const validURLs = this.validateExpiredURLs(signedURLs);

    if (signedToken) {
      isValid = validURLs.some(({ token }) => token === signedToken);
    }

    sourcemap.signedURLs = validURLs;

    return {
      isValid,
      sourcemap,
    };
  }

  exists(path: string) {
    return fs.existsSync(path);
  }

  readFile<T = any>(path: string, parse?: boolean): T {
    const file = fs.readFileSync(path, { encoding: 'utf-8' });

    if (!file) return;

    if (parse) return JSON.parse(file);

    return file as T;
  }

  async updateSourcemap(
    projectID: string,
    sourcemaps: SourceMap[],
    reset: boolean = false,
  ) {
    const dir = this.resolveSourcemaps(projectID);
    const existingSourcemaps = this.getProjectSourcemaps(projectID).filter(
      ({ id }) => !sourcemaps?.some(update => update?.id === id),
    );

    const updates: SourceMap[] = reset
      ? sourcemaps
      : existingSourcemaps.concat(sourcemaps);

    await this.createFile(dir, this.formatSourcemap(updates));
  }

  async createFile(
    path: string,
    data: string | NodeJS.ArrayBufferView,
  ): Promise<BaseResponse> {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, data, error => {
        if (error) return reject({ success: false, error });

        return resolve({ success: true });
      });
    });
  }

  async editFile<T extends string>(path: string, data: T) {
    return new Promise((resolve, reject) => {
      fs.appendFile(path, data, { encoding: 'utf-8', flush: true }, error => {
        if (error) return reject({ success: false, error });

        return resolve({ success: true });
      });
    });
  }

  async deleteFile(path: string): Promise<BaseResponse> {
    return new Promise((resolve, reject) => {
      fs.rm(path, error => {
        if (error) return reject({ error, success: false });

        return resolve({ success: true });
      });
    });
  }

  async createDirectories(
    dest: string,
    root: string,
  ): Promise<BaseResponse & { message: string }> {
    try {
      const paths = dest.split('/');

      for (let i = 0; i <= paths.length; i++) {
        const current = path.join(root, paths.slice(0, i).join('/'));

        if (this.exists(current)) continue;

        await this.createFolder(current);
      }

      return { success: true, message: this.messenger.create('destination') };
    } catch {
      return {
        success: true,
        message: this.messenger.create('destination', true),
      };
    }
  }

  async createFolder(
    path: string,
  ): Promise<BaseResponse & { message?: string }> {
    return new Promise((resolve, reject) => {
      if (this.exists(path)) return resolve({ success: true });

      fs.mkdir(path, error => {
        if (error) {
          return reject({
            success: false,
            error,
            message: this.messenger.create('folder', true),
          });
        }

        return resolve({
          success: true,
          message: this.messenger.create('folder'),
        });
      });
    });
  }

  async deleteFolder(
    path: string,
  ): Promise<BaseResponse & { message?: string }> {
    return new Promise((resolve, reject) => {
      try {
        fs.rmSync(path, { recursive: true, force: true });

        resolve({ success: true, message: this.messenger.remove('folder') });
      } catch {
        reject({
          success: false,
          message: this.messenger.remove('folder', true),
        });
      }
    });
  }

  async create(
    { path: dest, isPrivate = false }: CreateFileDto,
    file: Express.Multer.File,
    { id: projectID }: Project,
  ): Promise<HTTPResponse<ProjectFile>> {
    try {
      if (!file) throw new Error('invalid-file');

      const { buffer, originalname, size } = file;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [name, mimetype] = originalname.split('.').filter(piece => piece);
      const id = uuid();
      const fileName = `${id}.${mimetype}`;
      const root = path.join(this.root, projectID);
      const dirPath = path.join(root, dest);
      const filePath = path.join(dirPath, fileName);

      await this.createDirectories(dest, root);
      const { success } = await this.createFile(filePath, buffer);

      if (!success) throw new Error('error-saving-file');

      const data: ProjectFile = {
        id,
        projectID,
        name: originalname,
        url: this.getURL(id)?.url,
      };

      const sourcemap: SourceMap = {
        id,
        size,
        mimetype,
        isPrivate,
        path: filePath,
        name: originalname,
        createdAt: new Date(),
      };

      await this.updateSourcemap(projectID, [sourcemap]);

      return response({ data, status: HttpStatus.CREATED });
    } catch ({ message }: any) {
      switch (message) {
        case 'invalid-file':
          return response({
            error: true,
            status: HttpStatus.BAD_REQUEST,
            message: this.messenger.invalid('file', 'buffer'),
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

  async createSignedURL(
    id: string,
    { id: projectID }: Partial<Project>,
    { expiration }: CreateSignedURLDto,
  ): Promise<HTTPResponse<SignedURL>> {
    try {
      if (expiration > this.maxExpiration) {
        throw new Error('invalid-expiration');
      }

      const expiresAt = new Date();

      expiresAt.setSeconds(expiresAt.getSeconds() + expiration);

      const sourcemap = this.getProjectSourcemaps(projectID);

      if (!sourcemap || sourcemap?.length === 0) {
        throw new Error('no-project-sourcemap');
      }

      const index = sourcemap.findIndex(file => file?.id === id);

      if (index === -1) throw new Error('file-not-found');

      const file = sourcemap[index];

      if (!file?.isPrivate) {
        throw new Error('file-already-public');
      }

      const { token, url } = this.getURL(file?.id, true);

      const signedURL: SignedURL = {
        url,
        token,
        expiresAt,
        createdAt: new Date(),
      };

      const urls = this.validateExpiredURLs(file?.signedURLs);

      file.signedURLs = [...urls, signedURL];

      this.updateSourcemap(projectID, sourcemap, true);

      return response({ status: HttpStatus.CREATED, data: signedURL });
    } catch ({ message }: any) {
      switch (message) {
        case 'invalid-expiration':
          return response({
            error: true,
            status: HttpStatus.BAD_REQUEST,
            message: this.messenger.invalid(
              'expiration',
              'number and 604800 seconds of limit',
            ),
          });
        case 'file-already-public':
          return response({
            error: true,
            status: HttpStatus.NOT_FOUND,
            message: 'file is already of public access.',
          });
        case 'no-project-sourcemap':
          return response({
            error: true,
            status: HttpStatus.NOT_FOUND,
            message: this.messenger.empty('files'),
          });
        case 'file-not-found':
          return response({
            error: true,
            status: HttpStatus.NOT_FOUND,
            message: this.messenger.notfound('file'),
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

  async findOne(
    id: string,
    { id: projectID }: Partial<Project>,
  ): Promise<HTTPResponse<ReadOptions>> {
    try {
      const sourcemaps = this.getProjectSourcemaps(projectID);

      const data = sourcemaps.find(({ id: fileID }) => fileID === id);

      if (!data || Object.keys(data)?.length === 0) {
        throw new Error('sourmap-not-found');
      }

      const { path: dir, name } = data as SourceMap;

      const file = this.readFile<File>(dir);

      if (!file) throw new Error('file-not-found');

      return response({
        data: {
          file,
          name,
          path: dir,
          sourcemap: data,
          content: lookup(name),
          stream: fs.createReadStream(dir),
        },
        status: HttpStatus.OK,
      });
    } catch ({ message }: any) {
      switch (message) {
        case 'sourmap-not-found':
          return response({
            error: true,
            status: HttpStatus.NOT_FOUND,
            message: this.messenger.notfound('file'),
          });
        case 'file-not-found':
          return response({
            error: true,
            status: HttpStatus.NOT_FOUND,
            message: this.messenger.notfound('file'),
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

  async remove(id: string, { id: projectID }: Project): Promise<HTTPResponse> {
    try {
      const { data } = (await this.findOne(id, { id: projectID })) || {};

      const { path } = data || {};

      if (!path) throw new Error('no-path-found');

      const { success } = await this.deleteFile(path);

      if (!success) throw new Error('fail-deleting-file');

      const sourcemaps = this.getProjectSourcemaps(projectID);

      const updatedSourcemaps = sourcemaps.filter(file => file?.id !== id);

      await this.updateSourcemap(projectID, updatedSourcemaps, true);

      return response({
        status: HttpStatus.OK,
        message: this.messenger.remove('file'),
      });
    } catch ({ message }: any) {
      switch (message) {
        case 'no-path-found':
          return response({
            status: HttpStatus.NOT_FOUND,
            message: this.messenger.notfound('file'),
          });
        default:
          return response({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: this.messenger.internal(),
          });
      }
    }
  }

  async removeDir(
    dir: string,
    { id }: Partial<Project>,
  ): Promise<HTTPResponse> {
    try {
      const directory = path.join(id, dir);

      if (!this.exists(directory)) throw new Error('path-not-found');

      const { success } = await this.deleteFolder(directory);

      if (!success) throw new Error('error-deleting-folder');

      return response({
        status: HttpStatus.OK,
        message: this.messenger.remove('folder'),
      });
    } catch ({ message }: any) {
      switch (message) {
        case 'path-not-found':
          return response({
            status: HttpStatus.NOT_FOUND,
            message: this.messenger.notfound('folder'),
          });
        default:
          return response({
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: this.messenger.internal(),
          });
      }
    }
  }
}
