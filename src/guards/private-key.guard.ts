import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  forwardRef,
  Inject,
} from '@nestjs/common';

import { ProjectsService } from '@projects/projects.service';

import { response } from '@utils/functions';
import { ProjectRequest } from '@utils/interfaces';

@Injectable()
export class PrivateKeyGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ProjectRequest>();
    const key = request.headers['x-private-key'];

    const { data: projects = [] } = await this.projectsService.findAll();

    const project = projects.find(({ private_key }) => private_key === key);

    if (!project) {
      throw new UnauthorizedException(
        response({ message: 'Invalid private key.', error: true }),
      );
    }

    request.project = project;

    return true;
  }
}
