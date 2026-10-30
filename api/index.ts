import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../src/server/index.js';

/**
 * Vercel Serverless Function entry point.
 * Bridges incoming Vercel HTTP requests to the Express application.
 */
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
