import { HTTPResponse } from '../interfaces';

export function response<T = any>({
  data,
  error,
  message,
  status,
}: Omit<HTTPResponse<T>, 'success'>): Partial<HTTPResponse<T>> {
  const response: Partial<HTTPResponse<T>> = { success: true, message, status };

  if (error) {
    response.success = false;

    if (typeof error !== 'boolean') {
      response.error = error;
    }
  } else {
    response.data = data;
  }

  return response;
}
