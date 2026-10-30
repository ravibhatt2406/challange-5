import type { NextFunction, Request, Response } from 'express';
import { eventService } from '../services/eventService.js';
import { parseResourceId } from '../utils/resourceId.js';
import { ownerId } from './auth.js';

/** Prevents nested resources from being accessed through another owner's event ID. */
export async function requireEventOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const eventId = parseResourceId(String(req.params['eventId']));
    const event = await eventService.getById(eventId, ownerId(req));
    if (!event) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    res.locals['event'] = event;
    next();
  } catch (error) {
    next(error);
  }
}
