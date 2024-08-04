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
import Messenger from '@utils/messenger';

@Injectable()
export class PublicKeyGuard implements CanActivate {
  private readonly messenger = new Messenger();

  constructor(
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ProjectRequest>();
    const { public_key: key } = request.query || {};

    const { data: projects = [] } = await this.projectsService.findAll();

    const project = projects.find(({ public_key }) => public_key === key);

    if (!project) {
      throw new UnauthorizedException(
        response({ message: this.messenger.notfound('file'), error: true }),
      );
    }

    request.project = project;

    return true;
  }
}
