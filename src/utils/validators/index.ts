import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as path from 'path';

export function IsValidPath(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPath',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: any) {
          // Verifica se o valor é uma string e se é um caminho válido
          if (typeof value !== 'string') {
            return false;
          }

          // Verifica se o caminho é válido
          try {
            path.resolve(value);
            return true;
          } catch (error) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is not a valid path`;
        },
      },
    });
  };
}
