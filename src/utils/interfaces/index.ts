import { Request } from 'express';

export interface BaseResponse {
  error?: Error;
  success: boolean;
}

export interface HTTPResponse<T = any>
  extends Partial<Omit<BaseResponse, 'error'>> {
  message?: string;
  error?: Error | boolean;
  data?: T;
  status?: number;
}

export interface Project {
  id: string;
  createdAt: Date;
  folder: string;
  project: string;
  public_key: string;
  private_key: string;
}

export interface ProjectFile {
  url?: string;
  id: string;
  name: string;
  projectID: string;
}

export interface SignedURL {
  url: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface SourceMap {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  mimetype: string;
  isPrivate: boolean;
  signedURLs?: SignedURL[];
}

export interface ProjectRequest extends Request {
  project: Project;
}
