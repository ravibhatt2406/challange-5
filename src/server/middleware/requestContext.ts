import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/** Adds a safe correlation ID to responses without logging private event content. */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header('x-request-id')?.slice(0, 100) || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
