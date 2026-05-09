import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler =
  <TReq extends Request = Request>(
    handler: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>
  ) =>
  (req: TReq, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 0,
  baseDelay = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if it's a rate limit error (429)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2028') {
        // P2028 is for connection errors, but for Supabase, rate limits might be different
        // Actually, Supabase rate limits are HTTP 429, but Prisma might wrap it.
        // For now, retry on any error, but specifically check for rate limit.
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;

  const requestId = res.locals.requestId;
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong. Please try again.';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Requested record was not found.';
    } else if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      message = 'A record with this value already exists.';
      details = err.meta;
    }
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON.';
  } else if (err instanceof Error) {
    message = process.env.NODE_ENV === 'production' ? message : err.message;
  }

  if (statusCode >= 500) {
    console.error(`[${requestId}] ${req.method} ${req.originalUrl}`, err);
  }

  const dbUrl = process.env.DATABASE_URL;
  res.status(statusCode).json({
    error: {
      code,
      message: err instanceof Error ? err.message : message,
      requestId,
      debug_db_url: dbUrl ? dbUrl.replace(/:([^:@]+)@/, ':***@') : 'MISSING',
      ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
    },
  });
};
