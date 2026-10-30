import type { NextFunction, Request, Response } from 'express';

const requests = new Map<string, number[]>();

/** Applies a small in-memory guard to expensive AI routes in demo deployments. */
export function aiRateLimit(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = req.ownerId ?? req.ip ?? 'unknown';
  const recent = (requests.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 10) {
    res.status(429).json({ error: 'AI request limit reached. Please try again later.' });
    return;
  }
  recent.push(now);
  requests.set(key, recent);
  next();
}
