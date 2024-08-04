import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import Messenger from '@utils/messenger';
import { isUUID } from 'class-validator';

@Injectable()
export class UUIDValidationPipe implements PipeTransform<string> {
  private readonly messenger = new Messenger();

  transform(value: string): string {
    if (!isUUID(value)) {
      throw new BadRequestException(this.messenger.type('ID', 'uuid'));
    }
    return value;
  }
}
