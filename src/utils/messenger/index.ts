type TypeMap = 'string' | 'uuid';

export default class Messenger {
  create(field: string, failed?: boolean): string {
    if (failed) return `fail saving ${field}.`;

    return `${field} saved successfully.`;
  }

  update(field: string, failed?: boolean): string {
    if (failed) return `fail updating ${field}.`;

    return `${field} updated successfully.`;
  }

  remove(field: string, failed: boolean = false): string {
    if (failed) return `fail deleting ${field}.`;

    return `${field} deleted successfully.`;
  }

  unique(field: string) {
    return `${field} are already in use.`;
  }

  conflict(field: string) {
    return `${field} already exists.`;
  }

  notfound(field: string) {
    return `${field} not found.`;
  }

  empty(field: string) {
    return `no content for ${field} was found.`;
  }

  internal() {
    return 'an error occurred, try again later.';
  }

  type(field: string, type: TypeMap) {
    switch (type) {
      case 'uuid':
        return `${field} must be a valid UUID format.`;
      case 'string':
        return `${field} must be a valid string.`;
      default:
        return `${field} has an invalid format.`;
    }
  }

  invalid(field: string, expect: string) {
    return `${field} is not valid, must be of ${expect}.`;
  }
}
