export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export const notFound = (resource = "Resource") => new AppError(404, `${resource} not found`);
