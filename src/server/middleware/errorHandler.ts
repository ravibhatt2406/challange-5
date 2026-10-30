// ===========================================
// Error Handling Middleware
// ===========================================

import type { Request, Response, NextFunction } from 'express';

/**
 * Custom application error with status code.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }

}

/** Marks provider configuration failures as actionable service-unavailable errors. */
export function serviceUnavailable(message: string): AppError {
  return new AppError(503, message);
}

/**
 * Not Found error factory.
 */
export function notFound(resource: string, id: string): AppError {
  return new AppError(404, `${resource} with id '${id}' not found`);
}

/**
 * Global error handler middleware.
 * MUST have 4 parameters for Express to recognize it as error middleware.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log the full error server-side (never expose to client)
  console.error(`[ERROR] ${err.name}: ${err.message}`);
  if (!(err instanceof AppError)) {
    console.error(err.stack);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      request_id: _req.requestId,
    });
    return;
  }

  if (err.name === 'AiConfigurationError') {
    res.status(503).json({ error: 'AI service is not configured. Configure a supported server-side AI provider.', request_id: _req.requestId });
    return;
  }

  if (err.name === 'AiProviderError') {
    res.status(502).json({ error: 'The AI provider could not complete the request. Please try again.', request_id: _req.requestId });
    return;
  }

  if (err.message.startsWith('Missing SUPABASE')) {
    res.status(503).json({ error: 'Database is not configured. Add the database variables from .env.example.', request_id: _req.requestId });
    return;
  }

  // Generic server error — don't leak internals
  res.status(500).json({
    error: 'An unexpected error occurred. Please try again.',
    request_id: _req.requestId,
  });
}
