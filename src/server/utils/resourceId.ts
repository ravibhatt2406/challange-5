import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';

const uuidSchema = z.string().uuid();

/** Rejects malformed IDs before they reach a database query. */
export function parseResourceId(value: string): string {
  const result = uuidSchema.safeParse(value);
  if (!result.success) throw new AppError(400, 'Resource id must be a valid UUID');
  return result.data;
}
