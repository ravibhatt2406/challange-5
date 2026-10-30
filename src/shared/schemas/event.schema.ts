// ===========================================
// Event Validation Schemas
// ===========================================

import { z } from 'zod';
import { EVENT_TYPES } from '../constants/eventTypes.js';

export const createEventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  description: z.string().max(2000, 'Description must be 2000 characters or fewer').optional(),
  date: z.iso.datetime({ offset: true }).optional(),
  guest_count: z.number().int().min(1).max(100000).optional(),
  location: z.string().max(500).optional(),
  budget_amount: z.number().finite().min(0).max(100_000_000).optional(),
  currency: z.enum(['USD', 'CAD', 'GBP', 'EUR', 'AUD']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  date: z.iso.datetime({ offset: true }).optional().nullable(),
  guest_count: z.number().int().min(1).max(100000).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  budget_amount: z.number().finite().min(0).max(100_000_000).optional(),
  currency: z.enum(['USD', 'CAD', 'GBP', 'EUR', 'AUD']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
